import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_DNS_RECORDS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId query parameter' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, result: MOCK_DNS_RECORDS });
    }

    const client = getCloudflareClient(req);
    const records = await client.getDnsRecords(zoneId);
    return NextResponse.json({ success: true, result: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoneId, name, type, content, ttl = 1, proxied = false, priority, comment } = body;

    if (!zoneId || !name || !type || !content) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp đầy đủ zoneId, name, type, content' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      const newMockRecord = {
        id: `rec-demo-${Date.now()}`,
        zone_id: zoneId,
        zone_name: name,
        name,
        type,
        content,
        proxiable: ['A', 'AAAA', 'CNAME'].includes(type),
        proxied: ['A', 'AAAA', 'CNAME'].includes(type) ? proxied : false,
        ttl,
        priority,
        comment,
      };
      return NextResponse.json({ success: true, result: newMockRecord, message: 'Đã tạo DNS Record mới (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    const result = await client.createDnsRecord(zoneId, {
      type,
      name,
      content,
      ttl: Number(ttl),
      proxied: Boolean(proxied),
      priority: priority ? Number(priority) : undefined,
      comment,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoneId, recordId, ...updates } = body;

    if (!zoneId || !recordId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId or recordId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Cập nhật DNS Record thành công (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    const result = await client.updateDnsRecord(zoneId, recordId, updates);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const recordId = searchParams.get('recordId');

    if (!zoneId || !recordId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId or recordId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Xóa DNS Record thành công (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    const result = await client.deleteDnsRecord(zoneId, recordId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}
