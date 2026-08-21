import { NextRequest, NextResponse } from 'next/server';
import { CloudflareClient } from '@/lib/cloudflare/client';
import { generateTerraformCode } from '@/lib/terraform/generator';
import { MOCK_ZONES, MOCK_DNS_RECORDS, MOCK_FIREWALL_RULES, MOCK_IP_RULES } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim() || process.env.CLOUDFLARE_API_TOKEN;

  try {
    const body = await req.json();
    const { zoneId, options } = body;

    if (!zoneId) {
      return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    if (!token || token === 'demo-token') {
      const zone = MOCK_ZONES.find(z => z.id === zoneId) || { id: zoneId, name: 'demo-domain.com' };
      const { mainTf, tfvars } = generateTerraformCode(
        zone,
        MOCK_DNS_RECORDS,
        MOCK_FIREWALL_RULES,
        MOCK_IP_RULES,
        { ssl_mode: 'strict', min_tls_version: '1.2', always_use_https: true, automatic_https_rewrites: true },
        [],
        options
      );
      return NextResponse.json({ success: true, mainTf, tfvars });
    }

    const cf = new CloudflareClient(token);

    // Concurrently fetch zone info, DNS, WAF, SSL, PageRules
    const [zone, dnsRecords, firewallRules, ipRules, sslSetting, minTlsSetting, alwaysHttpsSetting, autoHttpsSetting, pageRules] = await Promise.allSettled([
      cf.getZone(zoneId),
      cf.getDnsRecords(zoneId),
      cf.getFirewallRules(zoneId),
      cf.getIpAccessRules(zoneId),
      cf.getZoneSetting(zoneId, 'ssl'),
      cf.getZoneSetting(zoneId, 'min_tls_version'),
      cf.getZoneSetting(zoneId, 'always_use_https'),
      cf.getZoneSetting(zoneId, 'automatic_https_rewrites'),
      cf.getPageRules(zoneId),
    ]);

    const zoneData = zone.status === 'fulfilled' ? zone.value : { id: zoneId, name: 'zone.domain' };
    const dnsData = dnsRecords.status === 'fulfilled' ? dnsRecords.value : [];
    const wafData = firewallRules.status === 'fulfilled' ? firewallRules.value : [];
    const ipData = ipRules.status === 'fulfilled' ? ipRules.value : [];
    const sslData = {
      ssl_mode: sslSetting.status === 'fulfilled' ? sslSetting.value?.value : 'strict',
      min_tls_version: minTlsSetting.status === 'fulfilled' ? minTlsSetting.value?.value : '1.2',
      always_use_https: alwaysHttpsSetting.status === 'fulfilled' ? alwaysHttpsSetting.value?.value === 'on' : true,
      automatic_https_rewrites: autoHttpsSetting.status === 'fulfilled' ? autoHttpsSetting.value?.value === 'on' : true,
    };
    const pageRulesData = pageRules.status === 'fulfilled' ? pageRules.value : [];

    const { mainTf, tfvars } = generateTerraformCode(
      zoneData,
      dnsData,
      wafData,
      ipData,
      sslData,
      pageRulesData,
      options
    );

    return NextResponse.json({ success: true, mainTf, tfvars });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate Terraform code' }, { status: 500 });
  }
}
