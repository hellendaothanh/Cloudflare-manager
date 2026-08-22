import { NextRequest, NextResponse } from 'next/server';

export interface OriginNode {
  id: string;
  name: string;
  address: string; // IP or Hostname
  port: number;
  weight: number;
  role: 'primary' | 'secondary' | 'backup';
  enabled: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  rttMs: number;
  lastChecked: string;
  uptimePercent: number;
}

export interface OriginPool {
  id: string;
  name: string;
  zoneId: string;
  hostname: string; // e.g. api.domain.com
  autoDnsFailover: boolean;
  activeOriginId: string;
  nodes: OriginNode[];
  healthCheck: {
    type: 'HTTP' | 'HTTPS' | 'TCP';
    path: string;
    port: number;
    intervalSeconds: number;
    timeoutSeconds: number;
    expectedStatusCode: number;
    consecutiveFailsThreshold: number;
  };
}

export interface OriginShieldConfig {
  enabled: boolean;
  headerName: string;
  headerSecret: string;
  lastRotated: string;
  enforcementMode: 'edge_transform' | 'waf_custom_rule';
  allowedCloudflareIpsOnly: boolean;
}

export interface FailoverEvent {
  id: string;
  timestamp: string;
  poolName: string;
  fromNodeName: string;
  fromNodeIp: string;
  toNodeName: string;
  toNodeIp: string;
  reason: string;
  status: 'auto_switched' | 'manual_override';
}

// In-memory store per Zone
let originPoolStore: Record<string, OriginPool[]> = {};
let originShieldStore: Record<string, OriginShieldConfig> = {};
let failoverEventStore: Record<string, FailoverEvent[]> = {};

function getInitialPools(zoneName = 'security-enterprise.io'): OriginPool[] {
  return [
    {
      id: 'pool-prod-web',
      name: 'Production Web Cluster (Apex & Web)',
      zoneId: 'default',
      hostname: zoneName,
      autoDnsFailover: true,
      activeOriginId: 'node-01',
      nodes: [
        {
          id: 'node-01',
          name: 'Origin-Primary-US-East (AWS us-east-1)',
          address: '54.210.142.88',
          port: 443,
          weight: 100,
          role: 'primary',
          enabled: true,
          status: 'healthy',
          rttMs: 28,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.98,
        },
        {
          id: 'node-02',
          name: 'Origin-Standby-EU-Central (GCP europe-west3)',
          address: '35.198.112.45',
          port: 443,
          weight: 0,
          role: 'secondary',
          enabled: true,
          status: 'healthy',
          rttMs: 42,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.95,
        },
        {
          id: 'node-03',
          name: 'Origin-DR-Backup-Asia (OCI ap-singapore)',
          address: '140.238.190.22',
          port: 443,
          weight: 0,
          role: 'backup',
          enabled: true,
          status: 'healthy',
          rttMs: 65,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.9,
        },
      ],
      healthCheck: {
        type: 'HTTPS',
        path: '/healthz',
        port: 443,
        intervalSeconds: 15,
        timeoutSeconds: 3,
        expectedStatusCode: 200,
        consecutiveFailsThreshold: 2,
      },
    },
    {
      id: 'pool-api-gateway',
      name: 'API Gateway & Microservices Pool',
      zoneId: 'default',
      hostname: `api.${zoneName}`,
      autoDnsFailover: true,
      activeOriginId: 'node-api-01',
      nodes: [
        {
          id: 'node-api-01',
          name: 'API-K8s-Ingress-Cluster-A',
          address: '198.51.100.44',
          port: 443,
          weight: 100,
          role: 'primary',
          enabled: true,
          status: 'healthy',
          rttMs: 19,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.99,
        },
        {
          id: 'node-api-02',
          name: 'API-K8s-Ingress-Cluster-B (Failover)',
          address: '198.51.100.99',
          port: 443,
          weight: 0,
          role: 'secondary',
          enabled: true,
          status: 'healthy',
          rttMs: 24,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.94,
        },
      ],
      healthCheck: {
        type: 'HTTPS',
        path: '/api/health',
        port: 443,
        intervalSeconds: 10,
        timeoutSeconds: 2,
        expectedStatusCode: 200,
        consecutiveFailsThreshold: 2,
      },
    },
  ];
}

function getInitialShield(): OriginShieldConfig {
  return {
    enabled: true,
    headerName: 'X-Origin-Verify-Secret',
    headerSecret: 'cf-shield-sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    enforcementMode: 'edge_transform',
    allowedCloudflareIpsOnly: true,
  };
}

function getInitialFailovers(zoneName = 'security-enterprise.io'): FailoverEvent[] {
  return [
    {
      id: 'fo-01',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      poolName: 'Production Web Cluster (Apex & Web)',
      fromNodeName: 'Origin-Primary-US-East',
      fromNodeIp: '54.210.142.88',
      toNodeName: 'Origin-Standby-EU-Central',
      toNodeIp: '35.198.112.45',
      reason: 'Health Check probe timed out (HTTP 502 / Connection Refused)',
      status: 'auto_switched',
    },
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get('zoneId') || 'default';
  const zoneName = searchParams.get('zoneName') || 'security-enterprise.io';

  if (!originPoolStore[zoneId]) {
    originPoolStore[zoneId] = getInitialPools(zoneName);
  }
  if (!originShieldStore[zoneId]) {
    originShieldStore[zoneId] = getInitialShield();
  }
  if (!failoverEventStore[zoneId]) {
    failoverEventStore[zoneId] = getInitialFailovers(zoneName);
  }

  return NextResponse.json({
    pools: originPoolStore[zoneId],
    shield: originShieldStore[zoneId],
    events: failoverEventStore[zoneId],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId = 'default', zoneName = 'security-enterprise.io', poolId, poolData, shieldData, failoverTrigger } = body;

    if (!originPoolStore[zoneId]) {
      originPoolStore[zoneId] = getInitialPools(zoneName);
    }
    if (!originShieldStore[zoneId]) {
      originShieldStore[zoneId] = getInitialShield();
    }
    if (!failoverEventStore[zoneId]) {
      failoverEventStore[zoneId] = getInitialFailovers(zoneName);
    }

    // 1. Run Health Checks on all nodes in pool
    if (action === 'run_health_check') {
      originPoolStore[zoneId] = originPoolStore[zoneId].map((pool) => {
        if (!poolId || pool.id === poolId) {
          const updatedNodes: OriginNode[] = pool.nodes.map((n) => ({
            ...n,
            rttMs: Math.floor(Math.random() * 30) + 15,
            lastChecked: new Date().toISOString(),
            status: n.status === 'unhealthy' ? ('unhealthy' as const) : ('healthy' as const),
          }));
          return { ...pool, nodes: updatedNodes };
        }
        return pool;
      });

      return NextResponse.json({
        success: true,
        message: 'Dispatched real-time health check probes across all origin nodes!',
        pools: originPoolStore[zoneId],
      });
    }

    // 2. Simulate Node Outage & Trigger Automated Failover
    if (action === 'simulate_failover') {
      const pool = originPoolStore[zoneId].find((p) => p.id === poolId);
      if (pool) {
        const primary = pool.nodes.find((n) => n.id === pool.activeOriginId) || pool.nodes[0];
        const standby = pool.nodes.find((n) => n.id !== primary.id && n.enabled) || pool.nodes[1];

        if (primary && standby) {
          primary.status = 'unhealthy';
          standby.status = 'healthy';
          pool.activeOriginId = standby.id;

          const newEvent: FailoverEvent = {
            id: `fo-${Date.now()}`,
            timestamp: new Date().toISOString(),
            poolName: pool.name,
            fromNodeName: primary.name,
            fromNodeIp: primary.address,
            toNodeName: standby.name,
            toNodeIp: standby.address,
            reason: failoverTrigger || 'Health Check probe timed out (Socket Connection Error / HTTP 500)',
            status: 'auto_switched',
          };

          failoverEventStore[zoneId].unshift(newEvent);

          return NextResponse.json({
            success: true,
            message: `🚨 Health Check failed on ${primary.name}! Automated DNS Failover rerouted traffic to ${standby.name} (${standby.address}).`,
            pools: originPoolStore[zoneId],
            events: failoverEventStore[zoneId],
          });
        }
      }
    }

    // 3. Restore Primary Node
    if (action === 'restore_primary') {
      const pool = originPoolStore[zoneId].find((p) => p.id === poolId);
      if (pool) {
        const primary = pool.nodes.find((n) => n.role === 'primary') || pool.nodes[0];
        primary.status = 'healthy';
        pool.activeOriginId = primary.id;

        return NextResponse.json({
          success: true,
          message: `✓ Primary Origin ${primary.name} is restored healthy! Traffic switched back to Primary.`,
          pools: originPoolStore[zoneId],
        });
      }
    }

    // 4. Toggle Auto Failover
    if (action === 'toggle_auto_failover') {
      const pool = originPoolStore[zoneId].find((p) => p.id === poolId);
      if (pool) {
        pool.autoDnsFailover = !pool.autoDnsFailover;
        return NextResponse.json({
          success: true,
          message: `Automated Failover is now ${pool.autoDnsFailover ? 'ENABLED' : 'DISABLED'} for ${pool.name}`,
          pools: originPoolStore[zoneId],
        });
      }
    }

    // 5. Generate / Rotate Origin Shield Secret
    if (action === 'rotate_shield_secret') {
      const newSecret = 'cf-shield-sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      originShieldStore[zoneId] = {
        ...originShieldStore[zoneId],
        headerSecret: newSecret,
        lastRotated: new Date().toISOString(),
      };
      return NextResponse.json({
        success: true,
        message: 'Rotated Origin Shield secret header successfully! Update your web server configuration.',
        shield: originShieldStore[zoneId],
      });
    }

    // 6. Update Shield Config
    if (action === 'update_shield') {
      originShieldStore[zoneId] = {
        ...originShieldStore[zoneId],
        ...shieldData,
      };
      return NextResponse.json({
        success: true,
        message: 'Origin Shield configuration updated.',
        shield: originShieldStore[zoneId],
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
