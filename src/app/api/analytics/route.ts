import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_ANALYTICS } from '@/lib/mock-data';

const COUNTRY_NAMES: Record<string, string> = {
  VN: 'Vietnam',
  US: 'United States',
  CN: 'China',
  RU: 'Russia',
  SG: 'Singapore',
  DE: 'Germany',
  GB: 'United Kingdom',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  BR: 'Brazil',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',
  NL: 'Netherlands',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  TH: 'Thailand',
  ID: 'Indonesia',
  MY: 'Malaysia',
  PH: 'Philippines',
  T1: 'Tor Exit Node',
  XX: 'Unknown Origin',
};

function generateZeroTimeseries(hours: number) {
  const points = [];
  const now = new Date();
  const stepMinutes = hours <= 6 ? 30 : hours <= 24 ? 60 : hours <= 72 ? 180 : 360;
  const count = Math.floor((hours * 60) / stepMinutes);

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * stepMinutes * 60 * 1000);
    points.push({
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requests: 0,
      cached: 0,
      bandwidth: 0,
      threats: 0,
    });
  }
  return points;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    // Only return mock analytics if explicitly in sandbox demo mode
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({
        success: true,
        result: MOCK_ANALYTICS,
      });
    }

    const client = getCloudflareClient(req);

    // 1. First, attempt Cloudflare REST Analytics Dashboard API
    const analytics = await client.getAnalyticsDashboard(zoneId, hours);

    if (analytics && (analytics.totals || Array.isArray(analytics.timeseries))) {
      const totals = analytics.totals || {};
      const requests = totals.requests || {};
      const bandwidth = totals.bandwidth || {};
      const threats = totals.threats || {};

      // Aggregate status codes into 2xx, 3xx, 4xx, 5xx
      const statusCodes: Record<string, number> = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
      if (requests.http_status && typeof requests.http_status === 'object') {
        for (const [code, count] of Object.entries(requests.http_status)) {
          const num = Number(count) || 0;
          const statusNum = parseInt(code, 10);
          if (statusNum >= 200 && statusNum < 300) statusCodes['2xx'] += num;
          else if (statusNum >= 300 && statusNum < 400) statusCodes['3xx'] += num;
          else if (statusNum >= 400 && statusNum < 500) statusCodes['4xx'] += num;
          else if (statusNum >= 500 && statusNum < 600) statusCodes['5xx'] += num;
        }
      }

      // If total requests exist but no status breakdown was returned, default all to 2xx
      const totalReq = requests.all || 0;
      const sumStatuses = statusCodes['2xx'] + statusCodes['3xx'] + statusCodes['4xx'] + statusCodes['5xx'];
      if (totalReq > 0 && sumStatuses === 0) {
        statusCodes['2xx'] = totalReq;
      }

      // Format top countries
      const topCountries = threats.country && typeof threats.country === 'object'
        ? Object.entries(threats.country)
            .map(([code, count]) => ({
              name: COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase(),
              count: Number(count) || 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

      // Format threat types
      const topTypes = threats.type && typeof threats.type === 'object'
        ? Object.entries(threats.type)
            .map(([name, count]) => ({
              name: name.toUpperCase(),
              count: Number(count) || 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

      // Format timeseries
      const timeseries = Array.isArray(analytics.timeseries) && analytics.timeseries.length > 0
        ? analytics.timeseries.map((t: any) => ({
            timestamp: new Date(t.since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            requests: t.requests?.all || 0,
            cached: t.requests?.cached || 0,
            bandwidth: t.bandwidth?.all || 0,
            threats: t.threats?.all || 0,
          }))
        : generateZeroTimeseries(hours);

      return NextResponse.json({
        success: true,
        result: {
          requests: {
            total: totalReq,
            cached: requests.cached || 0,
            uncached: requests.uncached || 0,
            encrypted: requests.ssl?.encrypted || totalReq,
            pageviews: totals.pageviews?.all || 0,
          },
          bandwidth: {
            total: bandwidth.all || 0,
            cached: bandwidth.cached || 0,
            uncached: bandwidth.uncached || 0,
            encrypted: bandwidth.ssl?.encrypted || bandwidth.all || 0,
          },
          threats: {
            total: threats.all || 0,
            top_countries: topCountries,
            top_types: topTypes,
          },
          status_codes: statusCodes,
          timeseries,
        },
      });
    }

    // 2. Fallback: Query Cloudflare GraphQL Analytics API if REST dashboard returned null
    const gqlRes = await client.getGraphQLAnalytics(zoneId, hours);
    const groups = gqlRes?.viewer?.zones?.[0]?.httpRequests1hGroups;

    if (Array.isArray(groups) && groups.length > 0) {
      let totalReq = 0;
      let cachedReq = 0;
      let totalBytes = 0;
      let cachedBytes = 0;
      let totalThreats = 0;
      let encReq = 0;

      const timeseries = groups.map((g: any) => {
        const sum = g.sum || {};
        const reqs = sum.requests || 0;
        const cReqs = sum.cachedRequests || 0;
        const bytes = sum.bytes || 0;
        const cBytes = sum.cachedBytes || 0;
        const thr = sum.threats || 0;

        totalReq += reqs;
        cachedReq += cReqs;
        totalBytes += bytes;
        cachedBytes += cBytes;
        totalThreats += thr;
        encReq += sum.encryptedRequests || 0;

        const time = new Date(g.dimensions?.datetime || new Date());
        return {
          timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          requests: reqs,
          cached: cReqs,
          bandwidth: bytes,
          threats: thr,
        };
      });

      return NextResponse.json({
        success: true,
        result: {
          requests: {
            total: totalReq,
            cached: cachedReq,
            uncached: Math.max(0, totalReq - cachedReq),
            encrypted: encReq || totalReq,
            pageviews: totalReq,
          },
          bandwidth: {
            total: totalBytes,
            cached: cachedBytes,
            uncached: Math.max(0, totalBytes - cachedBytes),
            encrypted: totalBytes,
          },
          threats: {
            total: totalThreats,
            top_countries: [],
            top_types: [],
          },
          status_codes: {
            '2xx': totalReq,
            '3xx': 0,
            '4xx': 0,
            '5xx': 0,
          },
          timeseries,
        },
      });
    }

    // 3. If the zone has 0 traffic or analytics are empty, return accurate 0 telemetry for the live zone
    return NextResponse.json({
      success: true,
      result: {
        requests: {
          total: 0,
          cached: 0,
          uncached: 0,
          encrypted: 0,
          pageviews: 0,
        },
        bandwidth: {
          total: 0,
          cached: 0,
          uncached: 0,
          encrypted: 0,
        },
        threats: {
          total: 0,
          top_countries: [],
          top_types: [],
        },
        status_codes: {
          '2xx': 0,
          '3xx': 0,
          '4xx': 0,
          '5xx': 0,
        },
        timeseries: generateZeroTimeseries(hours),
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Lỗi khi kết nối Cloudflare Analytics API',
    }, { status: error.status || 500 });
  }
}
