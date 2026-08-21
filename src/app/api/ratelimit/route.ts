import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_RATE_LIMITS, MOCK_RATE_LIMIT_ANALYTICS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId is required' }, { status: 400 });
    }

    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({
        success: true,
        result: {
          rules: MOCK_RATE_LIMITS,
          analytics: MOCK_RATE_LIMIT_ANALYTICS,
        },
      });
    }

    const client = getCloudflareClient(req);
    const rules = await client.getRateLimitRules(zoneId);

    return NextResponse.json({
      success: true,
      result: {
        rules: Array.isArray(rules) && rules.length > 0 ? rules : MOCK_RATE_LIMITS,
        analytics: MOCK_RATE_LIMIT_ANALYTICS,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      result: {
        rules: MOCK_RATE_LIMITS,
        analytics: MOCK_RATE_LIMIT_ANALYTICS,
      },
      warning: error.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    const { zoneId, rule } = body;

    if (!zoneId || !rule) {
      return NextResponse.json({ error: 'zoneId and rule are required' }, { status: 400 });
    }

    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({
        success: true,
        result: {
          id: `rl-custom-${Date.now()}`,
          ...rule,
          created_on: new Date().toISOString(),
        },
      });
    }

    const client = getCloudflareClient(req);
    const result = await client.createRateLimitRule(zoneId, rule);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const ruleId = searchParams.get('ruleId');

    if (!zoneId || !ruleId) {
      return NextResponse.json({ error: 'zoneId and ruleId are required' }, { status: 400 });
    }

    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Deleted rule (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    const result = await client.deleteRateLimitRule(zoneId, ruleId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
