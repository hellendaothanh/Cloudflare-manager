import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_ZONES } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-cf-token');
    if (authHeader?.includes('demo')) {
      return NextResponse.json({ success: true, result: MOCK_ZONES });
    }

    const client = getCloudflareClient(req);
    const zones = await client.getZones();
    return NextResponse.json({ success: true, result: zones });
  } catch (error: any) {
    // If token error or fallback
    return NextResponse.json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách Zones',
    }, { status: error.status || 500 });
  }
}
