import { NextRequest, NextResponse } from 'next/server';
import { dispatchAlert, AlertChannelConfig, DriftAlertPayload } from '@/lib/alerts/dispatcher';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, channels, payload } = body as {
      channel?: AlertChannelConfig;
      channels?: AlertChannelConfig[];
      payload: DriftAlertPayload;
    };

    if (!payload || !payload.zoneName) {
      return NextResponse.json({ error: 'Valid alert payload is required' }, { status: 400 });
    }

    if (channel) {
      const result = await dispatchAlert(channel, payload);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: result.message });
    }

    if (Array.isArray(channels) && channels.length > 0) {
      const activeChannels = channels.filter(c => c.enabled);
      if (activeChannels.length === 0) {
        return NextResponse.json({ success: true, message: 'No active channels configured', results: [] });
      }

      const results = await Promise.allSettled(
        activeChannels.map(ch => dispatchAlert(ch, payload))
      );

      const formattedResults = results.map((r, i) => ({
        channel: activeChannels[i].name,
        platform: activeChannels[i].platform,
        status: r.status === 'fulfilled' && r.value.success ? 'sent' : 'failed',
        error: r.status === 'fulfilled' ? (!r.value.success ? r.value.message : null) : (r.reason?.message || 'Error'),
      }));

      return NextResponse.json({ success: true, results: formattedResults });
    }

    return NextResponse.json({ error: 'Channel configuration is required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
