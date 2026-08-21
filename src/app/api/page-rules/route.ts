import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({
        success: true,
        result: [
          {
            id: 'pr-01',
            targets: [{ target: 'url', constraint: { operator: 'matches', value: 'security-enterprise.io/static/*' } }],
            actions: [{ id: 'browser_cache_ttl', value: 86400 }, { id: 'cache_level', value: 'cache_everything' }],
            priority: 1,
            status: 'active',
            created_on: '2025-01-15T00:00:00Z',
          },
          {
            id: 'pr-02',
            targets: [{ target: 'url', constraint: { operator: 'matches', value: 'security-enterprise.io/login' } }],
            actions: [{ id: 'security_level', value: 'high' }, { id: 'disable_performance' }],
            priority: 2,
            status: 'active',
            created_on: '2025-01-20T00:00:00Z',
          }
        ]
      });
    }

    const client = getCloudflareClient(req);
    const rules = await client.getPageRules(zoneId);
    return NextResponse.json({ success: true, result: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoneId, urlPattern, actions, priority = 1, status = 'active' } = body;

    if (!zoneId || !urlPattern) {
      return NextResponse.json({ success: false, message: 'Missing zoneId or urlPattern' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Tạo Page Rule thành công (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    const result = await client.createPageRule(zoneId, {
      targets: [{ target: 'url', constraint: { operator: 'matches', value: urlPattern } }],
      actions: actions || [{ id: 'always_use_https' }],
      priority: Number(priority),
      status,
    });
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const ruleId = searchParams.get('ruleId');

    if (!zoneId || !ruleId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId or ruleId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Đã xóa Page Rule (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    const result = await client.deletePageRule(zoneId, ruleId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}
