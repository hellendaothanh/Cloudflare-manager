import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_FIREWALL_RULES, MOCK_IP_RULES } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const type = searchParams.get('type') || 'all'; // 'waf' | 'ip' | 'all'

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({
        success: true,
        result: {
          firewall_rules: MOCK_FIREWALL_RULES,
          ip_rules: MOCK_IP_RULES,
          security_level: 'medium',
          bot_fight_mode: 'on',
        }
      });
    }

    const client = getCloudflareClient(req);
    const [firewallRules, ipRules, settings] = await Promise.all([
      client.getFirewallRules(zoneId),
      client.getIpAccessRules(zoneId),
      client.getZoneSettings(zoneId).catch(() => []),
    ]);

    const secLevelSetting = settings?.find((s: any) => s.id === 'security_level');

    return NextResponse.json({
      success: true,
      result: {
        firewall_rules: firewallRules,
        ip_rules: ipRules,
        security_level: secLevelSetting?.value || 'medium',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoneId, ruleType, ...payload } = body;

    if (!zoneId || !ruleType) {
      return NextResponse.json({ success: false, message: 'Missing zoneId or ruleType (ip/waf)' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Tạo quy tắc bảo mật thành công (Demo Mode)' });
    }

    const client = getCloudflareClient(req);

    if (ruleType === 'ip') {
      const result = await client.createIpAccessRule(zoneId, {
        mode: payload.mode,
        configuration: payload.configuration,
        notes: payload.notes,
      });
      return NextResponse.json({ success: true, result });
    } else if (ruleType === 'waf') {
      const result = await client.createFirewallRule(zoneId, {
        action: payload.action,
        description: payload.description,
        filter: {
          expression: payload.expression,
          description: payload.description,
        },
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, message: 'Unsupported ruleType' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const ruleId = searchParams.get('ruleId');
    const ruleType = searchParams.get('ruleType'); // 'waf' | 'ip'

    if (!zoneId || !ruleId || !ruleType) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({ success: true, message: 'Đã xóa quy tắc bảo mật (Demo Mode)' });
    }

    const client = getCloudflareClient(req);
    if (ruleType === 'ip') {
      const result = await client.deleteIpAccessRule(zoneId, ruleId);
      return NextResponse.json({ success: true, result });
    } else {
      const result = await client.deleteFirewallRule(zoneId, ruleId);
      return NextResponse.json({ success: true, result });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}
