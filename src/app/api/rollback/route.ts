import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { ZoneConfigSnapshot } from '@/types/cloudflare';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    const { zoneId, snapshot } = body as { zoneId: string; snapshot: ZoneConfigSnapshot };

    if (!zoneId || !snapshot) {
      return NextResponse.json({ error: 'zoneId and snapshot are required' }, { status: 400 });
    }

    // Demo Mode Simulation
    if (authHeader?.includes('demo') || zoneId.startsWith('zone-')) {
      return NextResponse.json({
        success: true,
        message: 'Snapshot restored successfully (Demo Mode Simulated)',
        result: {
          restoredAt: new Date().toISOString(),
          ssl_mode: snapshot.ssl_mode || 'strict',
          min_tls_version: snapshot.min_tls_version || '1.2',
          always_use_https: snapshot.always_use_https !== undefined ? snapshot.always_use_https : true,
          dns_records_count: snapshot.dns_records?.length || 0,
          firewall_rules_count: snapshot.firewall_rules?.length || 0,
        },
      });
    }

    const client = getCloudflareClient(req);
    const results: Record<string, any> = {};

    // 1. Restore SSL Mode
    if (snapshot.ssl_mode) {
      try {
        results.ssl_mode = await client.setSslSetting(zoneId, snapshot.ssl_mode as any);
      } catch (e: any) {
        results.ssl_mode_error = e.message;
      }
    }

    // 2. Restore Min TLS Version
    if (snapshot.min_tls_version) {
      try {
        results.min_tls = await client.updateZoneSetting(zoneId, 'min_tls_version', snapshot.min_tls_version);
      } catch (e: any) {
        results.min_tls_error = e.message;
      }
    }

    // 3. Restore Always Use HTTPS
    if (snapshot.always_use_https !== undefined) {
      try {
        results.always_use_https = await client.updateZoneSetting(
          zoneId,
          'always_use_https',
          snapshot.always_use_https ? 'on' : 'off'
        );
      } catch (e: any) {
        results.always_use_https_error = e.message;
      }
    }

    // 4. Restore Security Level
    if (snapshot.security_level) {
      try {
        results.security_level = await client.updateZoneSetting(zoneId, 'security_level', snapshot.security_level);
      } catch (e: any) {
        results.security_level_error = e.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Snapshot configuration applied successfully to Cloudflare edge',
      result: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Rollback execution failed' },
      { status: 500 }
    );
  }
}
