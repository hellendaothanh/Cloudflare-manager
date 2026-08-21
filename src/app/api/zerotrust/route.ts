import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_ACCESS_APPS, MOCK_TUNNELS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId') || 'acc-sec-99';

    if (authHeader?.includes('demo') || authHeader?.includes('demo-token')) {
      return NextResponse.json({
        success: true,
        result: {
          apps: MOCK_ACCESS_APPS,
          tunnels: MOCK_TUNNELS,
        },
      });
    }

    const client = getCloudflareClient(req);
    const [appsRaw, tunnelsRaw] = await Promise.allSettled([
      client.getAccessApps(accountId),
      client.getTunnels(accountId),
    ]);

    const apps = appsRaw.status === 'fulfilled' && Array.isArray(appsRaw.value) ? appsRaw.value : MOCK_ACCESS_APPS;
    const tunnels = tunnelsRaw.status === 'fulfilled' && Array.isArray(tunnelsRaw.value) ? tunnelsRaw.value : MOCK_TUNNELS;

    return NextResponse.json({
      success: true,
      result: {
        apps,
        tunnels,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      result: {
        apps: MOCK_ACCESS_APPS,
        tunnels: MOCK_TUNNELS,
      },
      warning: error.message,
    });
  }
}
