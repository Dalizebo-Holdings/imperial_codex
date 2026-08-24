import { Agent, ConversationManager } from '@openhands/typescript-client';

export class OpenHandsIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenHandsIntegrationError';
  }
}

export interface OpenHandsRunResult {
  conversationId: string;
  response: string;
}

interface OpenHandsConfig {
  host: string;
  apiKey: string;
  model: string;
  workspaceDir: string;
}

function getConfig(): OpenHandsConfig {
  const host = process.env.OPENHANDS_SERVER_URL?.trim();
  const apiKey = process.env.OPENHANDS_API_KEY?.trim();
  const model = process.env.OPENHANDS_LLM_MODEL?.trim() || 'gpt-4';
  const workspaceDir = process.env.OPENHANDS_WORKSPACE_DIR?.trim() || '/workspace';

  if (!host) {
    throw new OpenHandsIntegrationError(
      'OPENHANDS_SERVER_URL environment variable is not set.'
    );
  }

  if (!apiKey) {
    throw new OpenHandsIntegrationError(
      'OPENHANDS_API_KEY environment variable is not set.'
    );
  }

  return { host, apiKey, model, workspaceDir };
}

export function isOpenHandsAvailable(): boolean {
  return Boolean(
    process.env.OPENHANDS_SERVER_URL && process.env.OPENHANDS_API_KEY
  );
}

export async function runOpenHandsConversation(
  message: string,
  conversationId?: string
): Promise<OpenHandsRunResult> {
  if (!message || typeof message !== 'string') {
    throw new OpenHandsIntegrationError(
      'Message must be a non-empty string.'
    );
  }

  const { host, apiKey, model, workspaceDir } = getConfig();
  const manager = new ConversationManager({ host, apiKey });
  let conversation: Awaited<ReturnType<ConversationManager['createConversation']>> | null = null;

  try {
    if (conversationId) {
      conversation = await manager.loadConversation(conversationId, workspaceDir);
      await conversation.sendMessage(message);
      await conversation.run();
    } else {
      const agent = new Agent({
        llm: {
          model,
          api_key: apiKey,
        },
      });
      conversation = await manager.createConversation(agent, {
        initialMessage: message,
        workingDir: workspaceDir,
      });
      await conversation.run();
    }

    const response = await conversation.getAgentFinalResponse();
    return {
      conversationId: conversation.id,
      response,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'OpenHands agent request failed.';
    throw new OpenHandsIntegrationError(errorMessage);
  } finally {
    if (conversation) {
      try {
        await conversation.close();
      } catch {
        // Ignore cleanup failures
      }
    }
  }
}
