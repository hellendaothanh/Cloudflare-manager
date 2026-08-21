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
        result: {
          ssl_mode: 'strict',
          min_tls_version: '1.2',
          always_use_https: true,
          automatic_https_rewrites: true,
          tls_1_3: 'on',
          hsts: {
            enabled: true,
            max_age: 31536000,
            include_subdomains: true,
            nosniff: true,
            preload: true,
          },
          certificates: [
            {
              id: 'cert-universal-1',
              type: 'universal',
              hosts: ['security-enterprise.io', '*.security-enterprise.io'],
              status: 'active',
              issuer: "Let's Encrypt / Cloudflare Inc ECC CA-3",
              expires_on: '2027-05-15T00:00:00Z',
            }
          ]
        }
      });
    }

    const client = getCloudflareClient(req);
    let hasPermissionIssue = false;

    const [sslSetting, settings, certs] = await Promise.all([
      client.getSslSetting(zoneId).catch((err: any) => {
        if (err.status === 403 || err.message?.includes('Unauthorized')) {
          hasPermissionIssue = true;
        }
        return { value: 'flexible' };
      }),
      client.getZoneSettings(zoneId).catch((err: any) => {
        if (err.status === 403 || err.message?.includes('Unauthorized')) {
          hasPermissionIssue = true;
        }
        return [];
      }),
      client.getCertificates(zoneId).catch(() => []),
    ]);

    const minTls = settings.find((s: any) => s.id === 'min_tls_version')?.value || '1.0';
    const alwaysHttps = settings.find((s: any) => s.id === 'always_use_https')?.value === 'on';
    const autoHttps = settings.find((s: any) => s.id === 'automatic_https_rewrites')?.value === 'on';
    const tls13 = settings.find((s: any) => s.id === 'tls_1_3')?.value || 'on';
    const hstsSetting = settings.find((s: any) => s.id === 'security_header')?.value?.strict_transport_security || {
      enabled: false,
      max_age: 0,
      include_subdomains: false,
      nosniff: false,
    };

    return NextResponse.json({
      success: true,
      result: {
        ssl_mode: sslSetting?.value || 'flexible',
        min_tls_version: minTls,
        always_use_https: alwaysHttps,
        automatic_https_rewrites: autoHttps,
        tls_1_3: tls13,
        hsts: hstsSetting,
        certificates: certs,
        permission_warning: hasPermissionIssue,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Lỗi khi kết nối Cloudflare SSL API',
    }, { status: error.status || 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoneId, setting, value } = body;

    if (!zoneId || !setting) {
      return NextResponse.json({ success: false, message: 'Missing zoneId or setting name' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: `Cập nhật ${setting} thành công (Demo Mode)` });
    }

    const client = getCloudflareClient(req);
    const result = await client.updateZoneSetting(zoneId, setting, value);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message?.includes('Unauthorized') 
        ? 'API Token của bạn thiếu quyền hạn "Zone.Zone Settings: Edit" hoặc "Zone.SSL and Certificates: Edit". Hãy cấp thêm quyền này trên Cloudflare Dashboard.'
        : (error.message || 'Lỗi khi cập nhật cấu hình SSL'),
    }, { status: error.status || 500 });
  }
}
