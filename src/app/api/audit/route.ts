import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { evaluateZoneSecurity } from '@/lib/audit/security-rules';
import { MOCK_ZONES, MOCK_DNS_RECORDS, MOCK_FIREWALL_RULES, MOCK_IP_RULES } from '@/lib/mock-data';
import { ZoneConfigSnapshot } from '@/types/cloudflare';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const action = searchParams.get('action') || 'scan'; // 'scan' | 'export_snapshot'
    const lang = (searchParams.get('lang') as 'vi' | 'en') || 'vi';

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      const zone = MOCK_ZONES.find(z => z.id === zoneId) || MOCK_ZONES[0];
      
      if (action === 'export_snapshot') {
        const snapshot: ZoneConfigSnapshot = {
          version: '1.0.0',
          exported_at: new Date().toISOString(),
          zone,
          dns_records: MOCK_DNS_RECORDS,
          ssl_mode: 'strict',
          min_tls_version: '1.2',
          always_use_https: true,
          hsts: {
            enabled: true,
            max_age: 31536000,
            include_subdomains: true,
            nosniff: true,
            preload: true,
          },
          security_level: 'medium',
          firewall_rules: MOCK_FIREWALL_RULES,
          ip_access_rules: MOCK_IP_RULES,
          page_rules: [],
        };
        return NextResponse.json({ success: true, result: snapshot });
      }

      const audit = evaluateZoneSecurity({
        zone,
        sslMode: 'strict',
        minTlsVersion: '1.2',
        alwaysUseHttps: true,
        hstsEnabled: true,
        dnssecStatus: 'active',
        wafRulesCount: MOCK_FIREWALL_RULES.length,
        ipRulesCount: MOCK_IP_RULES.length,
        dnsRecords: MOCK_DNS_RECORDS,
        lang,
      });

      return NextResponse.json({ success: true, result: audit });
    }

    const client = getCloudflareClient(req);
    const [zone, dnsRecords, sslSetting, settings, dnssec, firewallRules, ipRules] = await Promise.all([
      client.getZone(zoneId),
      client.getDnsRecords(zoneId).catch(() => []),
      client.getSslSetting(zoneId).catch(() => ({ value: 'flexible' })),
      client.getZoneSettings(zoneId).catch(() => []),
      client.getDnssec(zoneId).catch(() => ({ status: 'disabled' })),
      client.getFirewallRules(zoneId).catch(() => []),
      client.getIpAccessRules(zoneId).catch(() => []),
    ]);

    const minTls = settings.find((s: any) => s.id === 'min_tls_version')?.value || '1.0';
    const alwaysHttps = settings.find((s: any) => s.id === 'always_use_https')?.value === 'on';
    const hstsSetting = settings.find((s: any) => s.id === 'security_header')?.value?.strict_transport_security;
    const secLevel = settings.find((s: any) => s.id === 'security_level')?.value || 'medium';

    if (action === 'export_snapshot') {
      const pageRules = await client.getPageRules(zoneId).catch(() => []);
      const snapshot: ZoneConfigSnapshot = {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        zone,
        dns_records: dnsRecords,
        ssl_mode: sslSetting?.value || 'flexible',
        min_tls_version: minTls,
        always_use_https: alwaysHttps,
        hsts: hstsSetting || { enabled: false, max_age: 0, include_subdomains: false, nosniff: false, preload: false },
        security_level: secLevel,
        firewall_rules: firewallRules,
        ip_access_rules: ipRules,
        page_rules: pageRules,
      };
      return NextResponse.json({ success: true, result: snapshot });
    }

    const audit = evaluateZoneSecurity({
      zone,
      sslMode: sslSetting?.value,
      minTlsVersion: minTls,
      alwaysUseHttps: alwaysHttps,
      hstsEnabled: Boolean(hstsSetting?.enabled),
      dnssecStatus: dnssec?.status || 'disabled',
      wafRulesCount: firewallRules.length,
      ipRulesCount: ipRules.length,
      dnsRecords,
      securityLevel: secLevel,
      lang,
    });

    return NextResponse.json({ success: true, result: audit });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}
