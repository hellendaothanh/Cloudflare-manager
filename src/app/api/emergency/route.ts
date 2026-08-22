import { NextRequest, NextResponse } from 'next/server';

export interface EmergencyState {
  isActive: boolean;
  activatedAt?: string;
  activatedBy?: string;
  mode: 'static_maintenance' | 'waiting_room' | 'r2_edge_fallback';
  targetScope: 'all_traffic' | 'root_domain_only' | 'api_bypass';
  httpStatusCode: 503 | 200 | 429;
  estimatedRecoveryTime?: string;
  maintenanceMessage: string;
  supportContact: string;
  customHtml?: string;
  autoEnableAlwaysOnline: boolean;
  autoPurgeEdgeCacheOnDeactivate: boolean;
}

// In-memory / Mock storage for Emergency Break-Glass state per Zone
let emergencyStore: Record<string, EmergencyState> = {};

function getInitialEmergencyState(): EmergencyState {
  return {
    isActive: false,
    mode: 'static_maintenance',
    targetScope: 'all_traffic',
    httpStatusCode: 503,
    estimatedRecoveryTime: '30-45 minutes',
    maintenanceMessage: 'Hệ thống đang tiến hành nâng cấp & bảo trì hạ tầng khẩn cấp. Mọi dịch vụ sẽ sớm hoạt động trở lại.',
    supportContact: 'noc-support@company.io',
    autoEnableAlwaysOnline: true,
    autoPurgeEdgeCacheOnDeactivate: true,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get('zoneId') || 'default';

  if (!emergencyStore[zoneId]) {
    emergencyStore[zoneId] = getInitialEmergencyState();
  }

  return NextResponse.json(emergencyStore[zoneId]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId = 'default', zoneName = 'example.com', state, operator = 'DevSecOps Admin' } = body;

    if (!emergencyStore[zoneId]) {
      emergencyStore[zoneId] = getInitialEmergencyState();
    }

    // 1. Activate Emergency Break-Glass Mode
    if (action === 'activate') {
      emergencyStore[zoneId] = {
        ...emergencyStore[zoneId],
        ...state,
        isActive: true,
        activatedAt: new Date().toISOString(),
        activatedBy: operator,
      };

      return NextResponse.json({
        success: true,
        message: `🚨 Emergency Break-Glass Failover ACTIVATED for ${zoneName}! All traffic routed to Edge Maintenance Shield.`,
        state: emergencyStore[zoneId],
      });
    }

    // 2. Deactivate Emergency Break-Glass Mode
    if (action === 'deactivate') {
      emergencyStore[zoneId] = {
        ...emergencyStore[zoneId],
        isActive: false,
      };

      return NextResponse.json({
        success: true,
        message: `✓ Emergency Break-Glass Mode DEACTIVATED. Traffic returned to Live Origin for ${zoneName}.`,
        state: emergencyStore[zoneId],
      });
    }

    // 3. Update Maintenance Template / Message
    if (action === 'update_template') {
      emergencyStore[zoneId] = {
        ...emergencyStore[zoneId],
        ...state,
      };

      return NextResponse.json({
        success: true,
        message: 'Emergency maintenance template updated successfully.',
        state: emergencyStore[zoneId],
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
