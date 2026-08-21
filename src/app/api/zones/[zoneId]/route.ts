import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_ZONES } from '@/lib/mock-data';

export async function GET(req: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  try {
    const { zoneId } = await params;
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      const found = MOCK_ZONES.find(z => z.id === zoneId) || MOCK_ZONES[0];
      return NextResponse.json({ success: true, result: found });
    }

    const client = getCloudflareClient(req);
    const zone = await client.getZone(zoneId);
    return NextResponse.json({ success: true, result: zone });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  try {
    const { zoneId } = await params;
    const body = await req.json();
    const { settingId, value } = body;

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: `Updated setting ${settingId} to ${value} (Demo Mode)` });
    }

    const client = getCloudflareClient(req);
    const result = await client.updateZoneSetting(zoneId, settingId, value);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  try {
    const { zoneId } = await params;
    const body = await req.json();
    const { action, purge_everything, files, hosts, tags } = body;

    if (action === 'purge_cache' || purge_everything !== undefined || files) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
        return NextResponse.json({ success: true, message: 'Purge cache thành công (Demo Mode)' });
      }

      const client = getCloudflareClient(req);
      const result = await client.purgeCache(zoneId, {
        purge_everything: purge_everything ?? true,
        files,
        hosts,
        tags,
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}
