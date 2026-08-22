import { NextRequest, NextResponse } from 'next/server';

export interface OriginNode {
  id: string;
  name: string;
  address: string; // IP or Hostname
  port: number;
  weight: number; // 0 - 100%
  role: 'primary' | 'secondary' | 'backup';
  enabled: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  rttMs: number;
  lastChecked: string;
  uptimePercent: number;
  region?: string;
}

export interface LoadBalancerConfig {
  id: string;
  name: string;
  hostname: string; // e.g. lb.domain.com
  steeringPolicy: 'off' | 'geo' | 'dynamic_latency' | 'random' | 'proximity';
  sessionAffinity: 'none' | 'cookie' | 'ip_cookie';
  sessionAffinityTtl: number; // in seconds (e.g. 1800)
  defaultPoolIds: string[];
  fallbackPoolId: string;
  geoSteeringMatrix: Record<string, string>; // Region Code -> Pool ID (e.g. "APAC": "pool-apac", "WNAM": "pool-us-east")
  enabled: boolean;
  ttl: number; // DNS TTL (e.g. 30s)
}

export interface OriginPool {
  id: string;
  name: string;
  zoneId: string;
  hostname: string; // e.g. api.domain.com
  autoDnsFailover: boolean;
  activeOriginId: string;
  minimumOrigins: number;
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
  status: 'auto_switched' | 'manual_override' | 'geo_rerouted';
}

// In-memory store per Zone
let originPoolStore: Record<string, OriginPool[]> = {};
let originShieldStore: Record<string, OriginShieldConfig> = {};
let failoverEventStore: Record<string, FailoverEvent[]> = {};
let loadBalancerStore: Record<string, LoadBalancerConfig[]> = {};

function getInitialPools(zoneName = 'security-enterprise.io'): OriginPool[] {
  return [
    {
      id: 'pool-us-east',
      name: 'North America (US-East AWS Cluster)',
      zoneId: 'default',
      hostname: zoneName,
      autoDnsFailover: true,
      activeOriginId: 'node-01',
      minimumOrigins: 1,
      nodes: [
        {
          id: 'node-01',
          name: 'Origin-Primary-US-East (AWS us-east-1)',
          address: '54.210.142.88',
          port: 443,
          weight: 70,
          role: 'primary',
          enabled: true,
          status: 'healthy',
          rttMs: 24,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.98,
          region: 'WNAM',
        },
        {
          id: 'node-02',
          name: 'Origin-Secondary-US-Central (GCP us-central1)',
          address: '35.224.110.12',
          port: 443,
          weight: 30,
          role: 'secondary',
          enabled: true,
          status: 'healthy',
          rttMs: 38,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.95,
          region: 'WNAM',
        },
      ],
      healthCheck: {
        type: 'HTTPS',
        path: '/healthz',
        port: 443,
        intervalSeconds: 10,
        timeoutSeconds: 2,
        expectedStatusCode: 200,
        consecutiveFailsThreshold: 2,
      },
    },
    {
      id: 'pool-eu-central',
      name: 'Europe (EU-Central Frankfurt Cluster)',
      zoneId: 'default',
      hostname: zoneName,
      autoDnsFailover: true,
      activeOriginId: 'node-eu-01',
      minimumOrigins: 1,
      nodes: [
        {
          id: 'node-eu-01',
          name: 'Origin-EU-Frankfurt (GCP europe-west3)',
          address: '35.198.112.45',
          port: 443,
          weight: 100,
          role: 'primary',
          enabled: true,
          status: 'healthy',
          rttMs: 29,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.97,
          region: 'EEU',
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
      id: 'pool-apac',
      name: 'Asia-Pacific (APAC Singapore & Tokyo)',
      zoneId: 'default',
      hostname: zoneName,
      autoDnsFailover: true,
      activeOriginId: 'node-apac-01',
      minimumOrigins: 1,
      nodes: [
        {
          id: 'node-apac-01',
          name: 'Origin-APAC-Singapore (OCI ap-singapore-1)',
          address: '140.238.190.22',
          port: 443,
          weight: 60,
          role: 'primary',
          enabled: true,
          status: 'healthy',
          rttMs: 18,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.99,
          region: 'SEAS',
        },
        {
          id: 'node-apac-02',
          name: 'Origin-APAC-Tokyo (AWS ap-northeast-1)',
          address: '13.112.80.91',
          port: 443,
          weight: 40,
          role: 'secondary',
          enabled: true,
          status: 'healthy',
          rttMs: 32,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.94,
          region: 'NEAS',
        },
      ],
      healthCheck: {
        type: 'HTTPS',
        path: '/healthz',
        port: 443,
        intervalSeconds: 10,
        timeoutSeconds: 2,
        expectedStatusCode: 200,
        consecutiveFailsThreshold: 2,
      },
    },
  ];
}

function getInitialLoadBalancers(zoneName = 'security-enterprise.io'): LoadBalancerConfig[] {
  return [
    {
      id: 'lb-prod-apex',
      name: 'Production Global Traffic Director',
      hostname: zoneName,
      steeringPolicy: 'geo',
      sessionAffinity: 'cookie',
      sessionAffinityTtl: 1800,
      defaultPoolIds: ['pool-us-east', 'pool-eu-central', 'pool-apac'],
      fallbackPoolId: 'pool-us-east',
      geoSteeringMatrix: {
        WNAM: 'pool-us-east',
        ENAM: 'pool-us-east',
        WEU: 'pool-eu-central',
        EEU: 'pool-eu-central',
        SEAS: 'pool-apac',
        NEAS: 'pool-apac',
        OC: 'pool-apac',
      },
      enabled: true,
      ttl: 30,
    },
    {
      id: 'lb-api-gateway',
      name: 'Dynamic Latency API Microservices LB',
      hostname: `api.${zoneName}`,
      steeringPolicy: 'dynamic_latency',
      sessionAffinity: 'none',
      sessionAffinityTtl: 0,
      defaultPoolIds: ['pool-us-east', 'pool-apac'],
      fallbackPoolId: 'pool-us-east',
      geoSteeringMatrix: {},
      enabled: true,
      ttl: 30,
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
      poolName: 'North America (US-East AWS Cluster)',
      fromNodeName: 'Origin-Primary-US-East',
      fromNodeIp: '54.210.142.88',
      toNodeName: 'Origin-Secondary-US-Central',
      toNodeIp: '35.224.110.12',
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
  if (!loadBalancerStore[zoneId]) {
    loadBalancerStore[zoneId] = getInitialLoadBalancers(zoneName);
  }

  return NextResponse.json({
    pools: originPoolStore[zoneId],
    loadBalancers: loadBalancerStore[zoneId],
    shield: originShieldStore[zoneId],
    events: failoverEventStore[zoneId],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId = 'default', zoneName = 'security-enterprise.io', poolId, lbId, lbData, poolData, shieldData, failoverTrigger } = body;

    if (!originPoolStore[zoneId]) originPoolStore[zoneId] = getInitialPools(zoneName);
    if (!originShieldStore[zoneId]) originShieldStore[zoneId] = getInitialShield();
    if (!failoverEventStore[zoneId]) failoverEventStore[zoneId] = getInitialFailovers(zoneName);
    if (!loadBalancerStore[zoneId]) loadBalancerStore[zoneId] = getInitialLoadBalancers(zoneName);

    // 1. Run Health Checks on all nodes in pool
    if (action === 'run_health_check') {
      originPoolStore[zoneId] = originPoolStore[zoneId].map((pool) => {
        if (!poolId || pool.id === poolId) {
          const updatedNodes: OriginNode[] = pool.nodes.map((n) => ({
            ...n,
            rttMs: Math.floor(Math.random() * 25) + 12,
            lastChecked: new Date().toISOString(),
            status: n.status === 'unhealthy' ? ('unhealthy' as const) : ('healthy' as const),
          }));
          return { ...pool, nodes: updatedNodes };
        }
        return pool;
      });

      return NextResponse.json({
        success: true,
        message: 'Hoàn tất quét kiểm tra sức khỏe Origin Nodes (Health Probes passed)!',
        pools: originPoolStore[zoneId],
      });
    }

    // 2. Update Load Balancer Configuration
    if (action === 'update_load_balancer') {
      loadBalancerStore[zoneId] = loadBalancerStore[zoneId].map((lb) => {
        if (lb.id === lbId) {
          return { ...lb, ...lbData };
        }
        return lb;
      });

      return NextResponse.json({
        success: true,
        message: 'Cập nhật cấu hình Cloudflare Load Balancer & Traffic Steering thành công!',
        loadBalancers: loadBalancerStore[zoneId],
      });
    }

    // 3. Create Load Balancer
    if (action === 'create_load_balancer') {
      const newLb: LoadBalancerConfig = {
        id: `lb-${Date.now()}`,
        name: lbData.name || 'New Load Balancer',
        hostname: lbData.hostname || zoneName,
        steeringPolicy: lbData.steeringPolicy || 'geo',
        sessionAffinity: lbData.sessionAffinity || 'cookie',
        sessionAffinityTtl: Number(lbData.sessionAffinityTtl) || 1800,
        defaultPoolIds: lbData.defaultPoolIds || [originPoolStore[zoneId][0]?.id],
        fallbackPoolId: lbData.fallbackPoolId || originPoolStore[zoneId][0]?.id,
        geoSteeringMatrix: lbData.geoSteeringMatrix || {},
        enabled: true,
        ttl: 30,
      };

      loadBalancerStore[zoneId] = [newLb, ...loadBalancerStore[zoneId]];
      return NextResponse.json({
        success: true,
        message: 'Khởi tạo Cloudflare Load Balancer mới thành công!',
        loadBalancers: loadBalancerStore[zoneId],
      });
    }

    // 4. Simulate Failure & Failover
    if (action === 'simulate_failover') {
      const pool = originPoolStore[zoneId].find((p) => p.id === poolId);
      if (pool) {
        const primary = pool.nodes.find((n) => n.role === 'primary');
        const standby = pool.nodes.find((n) => n.role === 'secondary') || pool.nodes[1];

        if (primary && standby) {
          primary.status = 'unhealthy';
          primary.rttMs = 999;
          standby.status = 'healthy';
          pool.activeOriginId = standby.id;

          const newEvent: FailoverEvent = {
            id: 'fo-' + Date.now(),
            timestamp: new Date().toISOString(),
            poolName: pool.name,
            fromNodeName: primary.name,
            fromNodeIp: primary.address,
            toNodeName: standby.name,
            toNodeIp: standby.address,
            reason: 'Mô phỏng sự cố: Primary node unreachability detected (HTTP 502/504)',
            status: 'auto_switched',
          };
          failoverEventStore[zoneId] = [newEvent, ...failoverEventStore[zoneId]];
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Đã kích hoạt DNS Failover chuyển đổi Origin sang Standby Node an toàn!',
        pools: originPoolStore[zoneId],
        events: failoverEventStore[zoneId],
      });
    }

    // 5. Restore Primary Origin
    if (action === 'restore_primary') {
      const pool = originPoolStore[zoneId].find((p) => p.id === poolId);
      if (pool) {
        const primary = pool.nodes.find((n) => n.role === 'primary') || pool.nodes[0];
        if (primary) {
          primary.status = 'healthy';
          primary.rttMs = 26;
          pool.activeOriginId = primary.id;

          const newEvent: FailoverEvent = {
            id: 'fo-' + Date.now(),
            timestamp: new Date().toISOString(),
            poolName: pool.name,
            fromNodeName: 'Standby-Node',
            fromNodeIp: 'standby.cluster',
            toNodeName: primary.name,
            toNodeIp: primary.address,
            reason: 'Khôi phục lưu lượng: Primary Origin recovered and healthy',
            status: 'manual_override',
          };
          failoverEventStore[zoneId] = [newEvent, ...failoverEventStore[zoneId]];
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Đã khôi phục lưu lượng về Primary Origin thành công!',
        pools: originPoolStore[zoneId],
        events: failoverEventStore[zoneId],
      });
    }

    // 6. Rotate Origin Shield Secret
    if (action === 'rotate_shield_secret') {
      const newSecret = 'cf-shield-sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      originShieldStore[zoneId] = {
        ...originShieldStore[zoneId],
        headerSecret: newSecret,
        lastRotated: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: 'Đã tạo mới và xoay vòng mã bí mật X-Origin-Verify-Secret thành công!',
        shield: originShieldStore[zoneId],
      });
    }

    return NextResponse.json({ success: true, message: 'Processed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
