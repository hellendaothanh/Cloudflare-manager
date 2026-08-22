import { NextRequest, NextResponse } from 'next/server';

export interface FinOpsCostMetric {
  totalRequests: number;
  cachedRequests: number;
  uncachedRequests: number;
  cacheHitRatioPercent: number;
  totalBandwidthGb: number;
  cachedBandwidthGb: number;
  originBandwidthGb: number;
  originEgressRatePerGb: number; // e.g. $0.09 / GB (AWS/GCP average)
  estimatedEgressCostSavedUsd: number;
  estimatedOriginCostPaidUsd: number;
}

export interface FinOpsRecommendation {
  id: string;
  category: 'cache_rules' | 'tiered_cache' | 'brotli' | 'early_hints' | 'workers_optimization';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  potentialMonthlySavingsUsd: number;
  applied: boolean;
  actionKey: string;
}

export interface WorkersUsageMetric {
  scriptName: string;
  invocations: number;
  avgCpuTimeMs: number;
  p95CpuTimeMs: number;
  subrequestsPerReq: number;
  memoryLimitMb: number;
  estimatedCostUsd: number;
  usageTier: 'standard' | 'bundled';
}

export interface R2StorageMetric {
  bucketName: string;
  storageSizeGb: number;
  classARequests: number; // Write, List (e.g. PutObject)
  classBRequests: number; // Read (e.g. GetObject)
  egressBandwidthGb: number;
  r2CostUsd: number;
  awsS3EstimatedEquivalentCostUsd: number;
  netSavingsUsd: number;
}

export interface TopEgressDrainEndpoint {
  path: string;
  hitRatioPercent: number;
  bandwidthGb: number;
  originCostUsd: number;
  suggestedAction: string;
}

// In-memory mock per Zone
let finOpsStore: Record<string, {
  cost: FinOpsCostMetric;
  recommendations: FinOpsRecommendation[];
  workers: WorkersUsageMetric[];
  r2: R2StorageMetric[];
  topDrains: TopEgressDrainEndpoint[];
}> = {};

function getInitialFinOpsData(zoneName = 'security-enterprise.io') {
  const totalRequests = 4850000;
  const cachedRequests = 4122500;
  const uncachedRequests = totalRequests - cachedRequests;
  const cacheHitRatioPercent = Number(((cachedRequests / totalRequests) * 100).toFixed(1));

  const totalBandwidthGb = 18450;
  const cachedBandwidthGb = 15867;
  const originBandwidthGb = totalBandwidthGb - cachedBandwidthGb;
  const originEgressRatePerGb = 0.09; // AWS/GCP avg egress

  const estimatedEgressCostSavedUsd = Number((cachedBandwidthGb * originEgressRatePerGb).toFixed(2));
  const estimatedOriginCostPaidUsd = Number((originBandwidthGb * originEgressRatePerGb).toFixed(2));

  const recommendations: FinOpsRecommendation[] = [
    {
      id: 'rec-01',
      category: 'tiered_cache',
      title: 'Bật Smart Tiered Caching (Global Cache Topology)',
      description: 'Định tuyến cache qua mạng lưới Data Center cấp 1 của Cloudflare, giảm thêm tới 55% request kéo về Origin Server.',
      impact: 'HIGH',
      potentialMonthlySavingsUsd: 145.8,
      applied: false,
      actionKey: 'enable_tiered_cache',
    },
    {
      id: 'rec-02',
      category: 'cache_rules',
      title: 'Tối ưu Edge Cache TTL cho Static Assets (Media & JS Bundles)',
      description: 'Thiết lập Browser & Edge TTL tối thiểu 30 ngày cho các đuôi mở rộng `.webp, .avif, .js, .css, .woff2`.',
      impact: 'HIGH',
      potentialMonthlySavingsUsd: 210.5,
      applied: false,
      actionKey: 'optimize_static_cache',
    },
    {
      id: 'rec-03',
      category: 'brotli',
      title: 'Bật Nén Brotli & Kích hoạt Early Hints (HTTP 103)',
      description: 'Nén Brotli giúp giảm 20-30% dung lượng payload truyền tải, tăng tốc độ tải trang và giảm băng thông.',
      impact: 'MEDIUM',
      potentialMonthlySavingsUsd: 68.2,
      applied: true,
      actionKey: 'enable_brotli_early_hints',
    },
    {
      id: 'rec-04',
      category: 'workers_optimization',
      title: 'Chuyển đổi KV Read Cache trong Workers Script',
      description: 'Lưu trữ session và cấu hình tạm thời trên Cloudflare KV Cache thay vì gọi trực tiếp database/upstream API.',
      impact: 'MEDIUM',
      potentialMonthlySavingsUsd: 85.0,
      applied: false,
      actionKey: 'enable_kv_cache',
    },
  ];

  const workers: WorkersUsageMetric[] = [
    {
      scriptName: 'auth-jwt-verifier-prod',
      invocations: 1850000,
      avgCpuTimeMs: 4.2,
      p95CpuTimeMs: 8.5,
      subrequestsPerReq: 0.8,
      memoryLimitMb: 128,
      estimatedCostUsd: 5.0,
      usageTier: 'standard',
    },
    {
      scriptName: 'image-optimizer-edge-transform',
      invocations: 920000,
      avgCpuTimeMs: 14.8,
      p95CpuTimeMs: 26.2,
      subrequestsPerReq: 1.2,
      memoryLimitMb: 256,
      estimatedCostUsd: 12.5,
      usageTier: 'standard',
    },
    {
      scriptName: 'dynamic-api-gateway-router',
      invocations: 2080000,
      avgCpuTimeMs: 6.1,
      p95CpuTimeMs: 11.4,
      subrequestsPerReq: 1.0,
      memoryLimitMb: 128,
      estimatedCostUsd: 7.2,
      usageTier: 'standard',
    },
  ];

  const r2: R2StorageMetric[] = [
    {
      bucketName: `${zoneName.replace(/\./g, '-')}-media-assets`,
      storageSizeGb: 4850,
      classARequests: 45000,
      classBRequests: 3200000,
      egressBandwidthGb: 14200,
      r2CostUsd: 72.75,
      awsS3EstimatedEquivalentCostUsd: 14200 * 0.09 + 4850 * 0.023 + 12.0, // S3 storage + $0.09/GB egress
      netSavingsUsd: 1329.55,
    },
    {
      bucketName: `${zoneName.replace(/\./g, '-')}-backups-cold`,
      storageSizeGb: 12400,
      classARequests: 1200,
      classBRequests: 4500,
      egressBandwidthGb: 350,
      r2CostUsd: 186.0,
      awsS3EstimatedEquivalentCostUsd: 12400 * 0.023 + 350 * 0.09,
      netSavingsUsd: 130.7,
    },
  ];

  const topDrains: TopEgressDrainEndpoint[] = [
    {
      path: '/static/videos/hero-product-demo.mp4',
      hitRatioPercent: 42.5,
      bandwidthGb: 845.2,
      originCostUsd: 76.06,
      suggestedAction: 'Tăng Cache-Control max-age lên 1 năm hoặc chuyển sang Cloudflare Stream/R2',
    },
    {
      path: '/api/v1/catalog/products.json',
      hitRatioPercent: 61.2,
      bandwidthGb: 520.4,
      originCostUsd: 46.83,
      suggestedAction: 'Bật Stale-While-Revalidate header để trả cache tức thì',
    },
    {
      path: '/assets/fonts/inter-variable.woff2',
      hitRatioPercent: 88.0,
      bandwidthGb: 310.8,
      originCostUsd: 27.97,
      suggestedAction: 'Áp dụng Immutable Cache Rule',
    },
    {
      path: '/uploads/high-res-banners/*.png',
      hitRatioPercent: 54.1,
      bandwidthGb: 412.0,
      originCostUsd: 37.08,
      suggestedAction: 'Bật Cloudflare Polish / Auto WebP Conversion',
    },
  ];

  return {
    cost: {
      totalRequests,
      cachedRequests,
      uncachedRequests,
      cacheHitRatioPercent,
      totalBandwidthGb,
      cachedBandwidthGb,
      originBandwidthGb,
      originEgressRatePerGb,
      estimatedEgressCostSavedUsd,
      estimatedOriginCostPaidUsd,
    },
    recommendations,
    workers,
    r2,
    topDrains,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get('zoneId') || 'default';
  const zoneName = searchParams.get('zoneName') || 'security-enterprise.io';

  if (!finOpsStore[zoneId]) {
    finOpsStore[zoneId] = getInitialFinOpsData(zoneName);
  }

  return NextResponse.json(finOpsStore[zoneId]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId = 'default', zoneName = 'security-enterprise.io', recId, egressRate } = body;

    if (!finOpsStore[zoneId]) {
      finOpsStore[zoneId] = getInitialFinOpsData(zoneName);
    }

    // 1. 1-Click Apply FinOps Optimization Recommendation
    if (action === 'apply_recommendation') {
      const rec = finOpsStore[zoneId].recommendations.find((r) => r.id === recId);
      if (rec) {
        rec.applied = true;
        // Improve cache metrics slightly to reflect optimization
        finOpsStore[zoneId].cost.cacheHitRatioPercent = Math.min(99.5, Number((finOpsStore[zoneId].cost.cacheHitRatioPercent + 3.2).toFixed(1)));
        finOpsStore[zoneId].cost.cachedBandwidthGb += 850;
        finOpsStore[zoneId].cost.originBandwidthGb = Math.max(0, finOpsStore[zoneId].cost.originBandwidthGb - 850);
        finOpsStore[zoneId].cost.estimatedEgressCostSavedUsd = Number(
          (finOpsStore[zoneId].cost.cachedBandwidthGb * finOpsStore[zoneId].cost.originEgressRatePerGb).toFixed(2)
        );

        return NextResponse.json({
          success: true,
          message: `✓ Applied FinOps optimization: "${rec.title}"! Edge cache efficiency increased.`,
          data: finOpsStore[zoneId],
        });
      }
    }

    // 2. Recalculate based on custom Egress Rate $/GB
    if (action === 'update_egress_rate' && typeof egressRate === 'number') {
      finOpsStore[zoneId].cost.originEgressRatePerGb = egressRate;
      finOpsStore[zoneId].cost.estimatedEgressCostSavedUsd = Number(
        (finOpsStore[zoneId].cost.cachedBandwidthGb * egressRate).toFixed(2)
      );
      finOpsStore[zoneId].cost.estimatedOriginCostPaidUsd = Number(
        (finOpsStore[zoneId].cost.originBandwidthGb * egressRate).toFixed(2)
      );

      return NextResponse.json({
        success: true,
        message: `Updated custom Origin Egress pricing to $${egressRate}/GB.`,
        data: finOpsStore[zoneId],
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
