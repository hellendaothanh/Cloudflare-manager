export type AlertPlatform = 'slack' | 'telegram' | 'discord' | 'webhook';

export interface AlertChannelConfig {
  id: string;
  name: string;
  platform: AlertPlatform;
  enabled: boolean;
  webhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  secretHeader?: string;
  minSeverity?: 'all' | 'high_only' | 'drift_only';
}

export interface DriftAlertPayload {
  zoneName: string;
  zoneId: string;
  score?: number;
  grade?: string;
  driftCount: number;
  drifts: Array<{ key: string; oldVal: string; currentVal: string }>;
  timestamp?: string;
  isTest?: boolean;
}

export async function dispatchAlert(
  channel: AlertChannelConfig,
  payload: DriftAlertPayload
): Promise<{ success: boolean; message: string }> {
  const ts = payload.timestamp || new Date().toISOString();
  const title = payload.isTest
    ? `🔔 [TEST] Cloudflare DevSecOps Alert Test`
    : `🚨 Cloudflare Configuration Drift Alert: ${payload.zoneName}`;

  try {
    if (channel.platform === 'slack') {
      if (!channel.webhookUrl) throw new Error('Slack Webhook URL is required');

      const driftText = payload.drifts.length > 0
        ? payload.drifts.map(d => `• \`${d.key}\`: \`${d.oldVal}\` ➔ \`${d.currentVal}\``).join('\n')
        : (payload.isTest ? '• Test configuration message: Connection verified successfully!' : 'No drift differences detected.');

      const body = {
        text: `${title} - ${payload.zoneName}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: payload.isTest ? '🔔 Cloudflare DevSecOps Test Alert' : '🚨 Cloudflare Configuration Drift Alert',
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Zone:*\n\`${payload.zoneName}\`` },
              { type: 'mrkdwn', text: `*CIS Score:*\n${payload.score ?? 92}/100 (${payload.grade || 'A'})` },
              { type: 'mrkdwn', text: `*Drift Items:*\n${payload.driftCount} changed` },
              { type: 'mrkdwn', text: `*Timestamp:*\n${ts}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Drift Details:*\n${driftText}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: '🛡️ Cloudflare DevSecOps Continuous Compliance Monitor',
              },
            ],
          },
        ],
      };

      const res = await fetch(channel.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Slack API error: ${res.status} ${res.statusText}`);
      }
      return { success: true, message: 'Slack alert dispatched successfully' };
    }

    if (channel.platform === 'discord') {
      if (!channel.webhookUrl) throw new Error('Discord Webhook URL is required');

      const driftList = payload.drifts.length > 0
        ? payload.drifts.map(d => `• **${d.key}**: \`${d.oldVal}\` ➔ \`${d.currentVal}\``).join('\n')
        : (payload.isTest ? '• Test ping successful! DevSecOps bot is live.' : 'No drift detected.');

      const body = {
        username: 'Cloudflare DevSecOps Compliance',
        avatar_url: 'https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/static/favicon.ico',
        embeds: [
          {
            title: payload.isTest ? '🔔 Test Alert - Cloudflare DevSecOps' : '🚨 Configuration Drift Detected',
            description: `Zone: **${payload.zoneName}** (${payload.zoneId})`,
            color: payload.isTest ? 3066993 : (payload.driftCount > 0 ? 15158332 : 3066993),
            fields: [
              { name: 'CIS Security Score', value: `${payload.score ?? 92}/100 (${payload.grade || 'A'})`, inline: true },
              { name: 'Drift Count', value: `${payload.driftCount} modifications`, inline: true },
              { name: 'Drift Differences', value: driftList.slice(0, 1000) },
            ],
            footer: { text: 'Cloudflare DevSecOps Continuous Compliance' },
            timestamp: ts,
          },
        ],
      };

      const res = await fetch(channel.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Discord API error: ${res.status} ${res.statusText}`);
      }
      return { success: true, message: 'Discord embed dispatched successfully' };
    }

    if (channel.platform === 'telegram') {
      if (!channel.telegramBotToken || !channel.telegramChatId) {
        throw new Error('Telegram Bot Token and Chat ID are required');
      }

      const driftHtml = payload.drifts.length > 0
        ? payload.drifts.map(d => `• <code>${d.key}</code>: <code>${d.oldVal}</code> ➔ <code>${d.currentVal}</code>`).join('\n')
        : (payload.isTest ? '• <i>Test notification: Verified successfully!</i>' : 'No drift detected.');

      const text = `<b>${payload.isTest ? '🔔 [TEST] Cloudflare DevSecOps' : '🚨 [ALERT] Configuration Drift Detected'}</b>\n\n` +
        `🌐 <b>Zone:</b> <code>${payload.zoneName}</code>\n` +
        `🛡️ <b>CIS Score:</b> ${payload.score ?? 92}/100 (Grade ${payload.grade || 'A'})\n` +
        `⚠️ <b>Drift Count:</b> ${payload.driftCount} changed parameters\n\n` +
        `<b>Drift Breakdown:</b>\n${driftHtml}\n\n` +
        `<i>🕒 ${ts}</i>`;

      const telegramUrl = `https://api.telegram.org/bot${channel.telegramBotToken.trim()}/sendMessage`;

      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channel.telegramChatId.trim(),
          parse_mode: 'HTML',
          text,
          disable_web_page_preview: true,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(`Telegram error: ${data.description || res.statusText}`);
      }
      return { success: true, message: 'Telegram message sent successfully' };
    }

    if (channel.platform === 'webhook') {
      if (!channel.webhookUrl) throw new Error('Webhook URL is required');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-DevSecOps-Manager/1.0',
      };

      if (channel.secretHeader) {
        headers['X-DevSecOps-Secret'] = channel.secretHeader;
      }

      const res = await fetch(channel.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: payload.isTest ? 'test_ping' : 'drift_detected',
          zone: {
            id: payload.zoneId,
            name: payload.zoneName,
          },
          compliance: {
            score: payload.score ?? 92,
            grade: payload.grade || 'A',
            driftCount: payload.driftCount,
            drifts: payload.drifts,
          },
          timestamp: ts,
        }),
      });

      if (!res.ok) {
        throw new Error(`Webhook target responded with status ${res.status}`);
      }
      return { success: true, message: 'Webhook payload delivered successfully' };
    }

    throw new Error(`Unsupported platform: ${channel.platform}`);
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to dispatch alert' };
  }
}
