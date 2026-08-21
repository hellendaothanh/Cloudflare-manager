import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/auth-helper';
import { MOCK_WORKERS, MOCK_PAGES } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId') || 'acc-sec-99';

    if (authHeader?.includes('demo') || authHeader?.includes('demo-token')) {
      return NextResponse.json({
        success: true,
        result: {
          workers: MOCK_WORKERS,
          pages: MOCK_PAGES,
        },
      });
    }

    const client = getCloudflareClient(req);
    const [workersRaw, pagesRaw] = await Promise.allSettled([
      client.getWorkerScripts(accountId),
      client.getPagesProjects(accountId),
    ]);

    const workers = workersRaw.status === 'fulfilled' && Array.isArray(workersRaw.value) ? workersRaw.value : MOCK_WORKERS;
    const pages = pagesRaw.status === 'fulfilled' && Array.isArray(pagesRaw.value) ? pagesRaw.value : MOCK_PAGES;

    return NextResponse.json({
      success: true,
      result: {
        workers,
        pages,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      result: {
        workers: MOCK_WORKERS,
        pages: MOCK_PAGES,
      },
      warning: error.message,
    });
  }
}
