import { NextRequest, NextResponse } from 'next/server';
import { CloudflareClient } from '@/lib/cloudflare/client';
import { MOCK_ZONES } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || process.env.CLOUDFLARE_API_TOKEN;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Cloudflare API Token không được để trống' }, { status: 400 });
    }

    if (token === 'demo-token' || token.startsWith('demo_')) {
      return NextResponse.json({
        success: true,
        is_demo: true,
        account: { id: 'demo-acc-01', name: 'DevSecOps Enterprise Demo Account' },
        zones_count: MOCK_ZONES.length,
        status: 'active',
      });
    }

    const client = new CloudflareClient(token);
    const verifyResult = await client.verifyToken();
    const accounts = await client.getAccounts().catch(() => []);

    return NextResponse.json({
      success: true,
      token_id: verifyResult.id,
      status: verifyResult.status,
      accounts: accounts.map((a: any) => ({ id: a.id, name: a.name })),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Xác thực Cloudflare API Token thất bại. Vui lòng kiểm tra lại quyền của Token.',
      errors: error.errors || [],
    }, { status: 401 });
  }
}
