import { NextRequest, NextResponse } from 'next/server';

export interface OriginSslCertInfo {
  id: string;
  serverName: string;
  ipAddress: string;
  port: number;
  role: 'primary' | 'secondary' | 'dr_backup';
  commonName: string;
  sanList: string[];
  issuer: string;
  validFrom: string;
  expiresOn: string;
  daysRemaining: number;
  status: 'safe' | 'warning' | 'critical' | 'expired';
  isCloudflareOriginCa: boolean;
  lastScannedAt: string;
}

export interface OriginScannerConfig {
  autoScanInterval: 'disabled' | 'daily' | 'every_6h' | 'every_12h';
  alertThresholdDays: number[]; // [30, 15, 7]
  telegramBotToken?: string;
  telegramChatId?: string;
  slackWebhookUrl?: string;
  lastAlertSentAt?: string;
}

// In-memory store per Zone
let originSslStore: Record<string, {
  certs: OriginSslCertInfo[];
  config: OriginScannerConfig;
}> = {};

function calculateDaysRemaining(expiresOnIso: string): number {
  const diff = new Date(expiresOnIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCertStatus(days: number): 'safe' | 'warning' | 'critical' | 'expired' {
  if (days <= 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'safe';
}

function getInitialOriginCerts(zoneName = 'security-enterprise.io'): { certs: OriginSslCertInfo[]; config: OriginScannerConfig } {
  const now = new Date();
  
  // Cert 1: 18 ngày còn lại -> WARNING (Let's Encrypt sắp hết hạn)
  const exp1 = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString();
  // Cert 2: 5 ngày còn lại -> CRITICAL (Nguy cơ Error 526)
  const exp2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  // Cert 3: 5200 ngày còn lại -> SAFE (Cloudflare Origin CA 15 năm)
  const exp3 = new Date(now.getTime() + 5200 * 24 * 60 * 60 * 1000).toISOString();

  const certs: OriginSslCertInfo[] = [
    {
      id: 'orig-cert-01',
      serverName: 'Origin Primary (AWS ap-southeast-1)',
      ipAddress: '13.250.14.88',
      port: 443,
      role: 'primary',
      commonName: zoneName,
      sanList: [zoneName, `*.${zoneName}`, `api.${zoneName}`],
      issuer: "Let's Encrypt Authority X3 / R3",
      validFrom: new Date(now.getTime() - 72 * 24 * 60 * 60 * 1000).toISOString(),
      expiresOn: exp1,
      daysRemaining: 18,
      status: 'warning',
      isCloudflareOriginCa: false,
      lastScannedAt: now.toISOString(),
    },
    {
      id: 'orig-cert-02',
      serverName: 'Origin Secondary Standby (GCP asia-east1)',
      ipAddress: '34.80.120.45',
      port: 443,
      role: 'secondary',
      commonName: `origin-standby.${zoneName}`,
      sanList: [`origin-standby.${zoneName}`, zoneName],
      issuer: 'ZeroSSL RSA Domain Secure CA',
      validFrom: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000).toISOString(),
      expiresOn: exp2,
      daysRemaining: 5,
      status: 'critical',
      isCloudflareOriginCa: false,
      lastScannedAt: now.toISOString(),
    },
    {
      id: 'orig-cert-03',
      serverName: 'Origin DR Backup (Cloudflare Origin CA 15-Year)',
      ipAddress: '104.21.55.90',
      port: 443,
      role: 'dr_backup',
      commonName: `Cloudflare Origin Certificate`,
      sanList: [zoneName, `*.${zoneName}`],
      issuer: 'Cloudflare Origin CA (15-Year Dedicated)',
      validFrom: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      expiresOn: exp3,
      daysRemaining: 5200,
      status: 'safe',
      isCloudflareOriginCa: true,
      lastScannedAt: now.toISOString(),
    },
  ];

  return {
    certs,
    config: {
      autoScanInterval: 'daily',
      alertThresholdDays: [30, 15, 7],
      telegramBotToken: '7123456789:AAHqDemoTokenExampleBotSecure',
      telegramChatId: '-100192837465',
      slackWebhookUrl: 'https://hooks.slack.com/services/T000/B000/XYZDemoSecurityWebhook',
      lastAlertSentAt: new Date(now.getTime() - 3600 * 1000 * 4).toISOString(),
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get('zoneId') || 'default';
  const zoneName = searchParams.get('zoneName') || 'security-enterprise.io';

  if (!originSslStore[zoneId]) {
    originSslStore[zoneId] = getInitialOriginCerts(zoneName);
  }

  return NextResponse.json({
    success: true,
    data: originSslStore[zoneId],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId = 'default', zoneName = 'security-enterprise.io', config } = body;

    if (!originSslStore[zoneId]) {
      originSslStore[zoneId] = getInitialOriginCerts(zoneName);
    }

    // 1. Quét mới toàn bộ Origin SSLs (Simulate active TLS Handshake probing)
    if (action === 'scan_all_origins') {
      const now = new Date();
      originSslStore[zoneId].certs = originSslStore[zoneId].certs.map((c) => {
        const days = calculateDaysRemaining(c.expiresOn);
        return {
          ...c,
          daysRemaining: days,
          status: getCertStatus(days),
          lastScannedAt: now.toISOString(),
        };
      });

      const warningCount = originSslStore[zoneId].certs.filter(c => c.status === 'warning' || c.status === 'critical').length;

      return NextResponse.json({
        success: true,
        message: `✓ Hoàn thành quét TLS Handshake cho ${originSslStore[zoneId].certs.length} máy chủ gốc. Phát hiện ${warningCount} chứng chỉ cần gia hạn.`,
        data: originSslStore[zoneId],
      });
    }

    // 2. Gửi Cảnh báo thử nghiệm qua Telegram / Slack
    if (action === 'dispatch_alert') {
      originSslStore[zoneId].config.lastAlertSentAt = new Date().toISOString();
      return NextResponse.json({
        success: true,
        message: `✓ Đã phát cảnh báo khẩn cấp (Origin SSL Expiry Alert) đến Telegram Bot & Slack Webhook thành công!`,
        data: originSslStore[zoneId],
      });
    }

    // 3. Cập nhật cấu hình Scanner & Webhooks
    if (action === 'update_config' && config) {
      originSslStore[zoneId].config = {
        ...originSslStore[zoneId].config,
        ...config,
      };
      return NextResponse.json({
        success: true,
        message: 'Cập nhật cấu hình cảnh báo Origin SSL thành công.',
        data: originSslStore[zoneId],
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
