import { NextRequest } from 'next/server';
import { CloudflareClient } from './client';

export function getCloudflareClient(req: NextRequest): CloudflareClient {
  const authHeader = req.headers.get('Authorization') || req.headers.get('x-cf-token');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    throw new Error('API Token không tìm thấy. Vui lòng cung cấp Cloudflare API Token trong Header hoặc .env.local');
  }

  return new CloudflareClient(token);
}
