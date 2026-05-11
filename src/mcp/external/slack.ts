/**
 * Slack MCP Client Wrapper
 *
 * Lazy-initialised Slack integration for rich alert messages.
 * Only initialises when SLACK_BOT_TOKEN is present in the environment.
 * Returns null if the env var is absent — no error thrown.
 *
 * Used by BackgroundAgentService to send formatted critical loop alerts.
 */

let _slackClient: SlackClient | null = null;

interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: Array<{ type: string; text: string }>;
}

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}

interface SlackClient {
  postMessage(message: SlackMessage): Promise<void>;
}

/**
 * Checks if Slack integration is available (SLACK_BOT_TOKEN is set).
 */
export function isSlackAvailable(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN);
}

/**
 * Returns the Slack client, initialising it lazily on first call.
 * Returns null if SLACK_BOT_TOKEN is not set.
 */
export function getSlackClient(): SlackClient | null {
  if (!isSlackAvailable()) return null;

  if (!_slackClient) {
    const token = process.env.SLACK_BOT_TOKEN!;
    const channel = process.env.SLACK_ALERT_CHANNEL ?? '#imperial-codex-alerts';

    _slackClient = {
      async postMessage(message: SlackMessage): Promise<void> {
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel: message.channel ?? channel,
            text: message.text,
            blocks: message.blocks,
          }),
        });

        if (!response.ok) {
          throw new Error(`Slack API error: HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error}`);
        }
      },
    };
  }

  return _slackClient;
}

/**
 * Sends a formatted critical loop alert to Slack.
 * Falls back silently if Slack is not configured.
 */
export async function sendCriticalLoopAlert(params: {
  loopId: string;
  loopTitle: string;
  triggeredAt: string;
  targetSlug: string;
  outputAction: string;
}): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channel = process.env.SLACK_ALERT_CHANNEL ?? '#imperial-codex-alerts';

  try {
    await client.postMessage({
      channel,
      text: `🚨 Critical Loop Triggered: ${params.loopTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Imperial Codex — Critical Loop Alert',
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Loop ID:*\n${params.loopId}` },
            { type: 'mrkdwn', text: `*Loop Title:*\n${params.loopTitle}` },
            { type: 'mrkdwn', text: `*Target Module:*\n${params.targetSlug}` },
            { type: 'mrkdwn', text: `*Output Action:*\n${params.outputAction}` },
            { type: 'mrkdwn', text: `*Triggered At:*\n${params.triggeredAt}` },
            { type: 'mrkdwn', text: `*Severity:*\n🔴 CRITICAL` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `View in Codex: ${process.env.MCP_SERVER_URL ?? 'https://imperial-codex.vercel.app'}/os-modules/${params.targetSlug}`,
          },
        },
      ],
    });
  } catch (err) {
    console.error('[Slack] Failed to send critical loop alert:', err);
    // Never throw — Slack failure must not halt the background agent
  }
}
