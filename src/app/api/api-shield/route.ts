import { NextRequest, NextResponse } from 'next/server';

export interface MtlsCertificate {
  id: string;
  name: string;
  issuer: string;
  serialNumber: string;
  fingerprintSha256: string;
  expiresOn: string;
  status: 'active' | 'revoked' | 'expired';
  associationHosts: string[];
  clientCertType: 'b2b_partner' | 'microservice_internal' | 'mobile_app' | 'iot_device';
  createdOn: string;
}

export interface ApiShieldSchema {
  id: string;
  name: string;
  version: string;
  fileFormat: 'json' | 'yaml';
  endpointCount: number;
  validationAction: 'block' | 'log' | 'managed_challenge';
  learnedRouting: boolean;
  uploadedAt: string;
  endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    authRequired: boolean;
    schemaEnforced: boolean;
  }>;
}

export interface ApiSecurityState {
  mtlsEnabled: boolean;
  schemaValidationEnabled: boolean;
  learnedThreshold: number;
  mtlsCerts: MtlsCertificate[];
  schemas: ApiShieldSchema[];
  blockedPayloadLogs: Array<{
    id: string;
    timestamp: string;
    clientIp: string;
    endpoint: string;
    method: string;
    reason: string;
    action: string;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId' }, { status: 400 });
    }

    const mockData: ApiSecurityState = {
      mtlsEnabled: true,
      schemaValidationEnabled: true,
      learnedThreshold: 98,
      mtlsCerts: [
        {
          id: 'mtls-cert-01',
          name: 'B2B Core Banking Payment Gateway (mTLS)',
          issuer: 'Cloudflare Managed CA Enterprise',
          serialNumber: '5A:3F:89:C2:90:E1',
          fingerprintSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          expiresOn: '2027-08-20T00:00:00Z',
          status: 'active',
          associationHosts: ['api.security-enterprise.io', 'payment-gateway.security-enterprise.io'],
          clientCertType: 'b2b_partner',
          createdOn: '2025-08-20T10:00:00Z',
        },
        {
          id: 'mtls-cert-02',
          name: 'Internal Microservices Mesh Inter-Connect',
          issuer: 'HashiCorp Vault Vault-CA',
          serialNumber: '9B:71:04:D8:AA:F3',
          fingerprintSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          expiresOn: '2026-11-15T00:00:00Z',
          status: 'active',
          associationHosts: ['grpc-internal.security-enterprise.io'],
          clientCertType: 'microservice_internal',
          createdOn: '2025-11-15T08:30:00Z',
        },
      ],
      schemas: [
        {
          id: 'schema-v2-main',
          name: 'OpenAPI 3.1 Production Core API Spec',
          version: '2.5.0',
          fileFormat: 'yaml',
          endpointCount: 34,
          validationAction: 'block',
          learnedRouting: true,
          uploadedAt: '2026-08-21T04:20:00Z',
          endpoints: [
            { method: 'POST', path: '/api/v2/payments/transfer', authRequired: true, schemaEnforced: true },
            { method: 'POST', path: '/api/v2/auth/token', authRequired: false, schemaEnforced: true },
            { method: 'GET', path: '/api/v2/users/{id}/profile', authRequired: true, schemaEnforced: true },
            { method: 'PUT', path: '/api/v2/orders/{orderId}/status', authRequired: true, schemaEnforced: true },
            { method: 'DELETE', path: '/api/v2/sessions/revoke', authRequired: true, schemaEnforced: true },
          ],
        },
        {
          id: 'schema-v1-partner',
          name: 'Swagger 2.0 B2B Partner Integration Spec',
          version: '1.8.4',
          fileFormat: 'json',
          endpointCount: 12,
          validationAction: 'managed_challenge',
          learnedRouting: false,
          uploadedAt: '2026-08-15T09:12:00Z',
          endpoints: [
            { method: 'POST', path: '/partner/v1/webhooks', authRequired: true, schemaEnforced: true },
            { method: 'GET', path: '/partner/v1/inventory/sync', authRequired: true, schemaEnforced: true },
          ],
        },
      ],
      blockedPayloadLogs: [
        {
          id: 'blk-01',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          clientIp: '198.51.100.44',
          endpoint: '/api/v2/payments/transfer',
          method: 'POST',
          reason: 'Schema Validation Failure: field `amount` must be number > 0, received string "NaN"',
          action: 'BLOCK (HTTP 400)',
        },
        {
          id: 'blk-02',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          clientIp: '203.0.113.89',
          endpoint: '/grpc-internal.security-enterprise.io',
          method: 'POST',
          reason: 'mTLS Handshake Rejected: Missing or untrusted client x509 certificate',
          action: 'BLOCK (HTTP 403)',
        },
        {
          id: 'blk-03',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          clientIp: '192.0.2.17',
          endpoint: '/api/v2/auth/token',
          method: 'POST',
          reason: 'Schema Validation Failure: missing required property `client_id`',
          action: 'BLOCK (HTTP 400)',
        },
      ],
    };

    return NextResponse.json({ success: true, result: mockData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId, cert, schema, config } = body;

    if (!zoneId) {
      return NextResponse.json({ success: false, message: 'Missing zoneId' }, { status: 400 });
    }

    if (action === 'create_mtls_cert') {
      return NextResponse.json({
        success: true,
        message: 'Tạo và kích hoạt chứng chỉ mTLS Client Certificate thành công (Demo Mode)!',
        cert: {
          id: `mtls-${Date.now()}`,
          ...cert,
          serialNumber: '7C:1E:99:A2:33:B1',
          fingerprintSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
          createdOn: new Date().toISOString(),
          status: 'active',
        },
      });
    }

    if (action === 'import_openapi_schema') {
      return NextResponse.json({
        success: true,
        message: 'Import và phân tích OpenAPI/Swagger Schema thành công! Đã đồng bộ 28 endpoints và kích hoạt Edge Schema Validation.',
        schema: {
          id: `schema-${Date.now()}`,
          ...schema,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    if (action === 'save_settings') {
      return NextResponse.json({
        success: true,
        message: 'Lưu cấu hình API Shield & mTLS thành công!',
      });
    }

    return NextResponse.json({ success: true, message: 'Processed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }
}
