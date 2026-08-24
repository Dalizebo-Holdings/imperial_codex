import { OpenHandsIntegrationError, isOpenHandsAvailable, runOpenHandsConversation } from '../OpenHandsService';

const mockConversation = {
  id: 'conv-1',
  sendMessage: jest.fn(async () => undefined),
  run: jest.fn(async () => undefined),
  getAgentFinalResponse: jest.fn(async () => 'Hello from OpenHands'),
  close: jest.fn(async () => undefined),
};

const mockConversationManager = jest.fn().mockImplementation(() => ({
  createConversation: jest.fn(async () => mockConversation),
  loadConversation: jest.fn(async () => mockConversation),
}));

const mockAgent = jest.fn();

jest.mock('@openhands/typescript-client', () => ({
  Agent: mockAgent,
  ConversationManager: mockConversationManager,
}));

describe('OpenHandsService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reports OpenHands as unavailable when required env vars are missing', () => {
    delete process.env.OPENHANDS_SERVER_URL;
    delete process.env.OPENHANDS_API_KEY;

    expect(isOpenHandsAvailable()).toBe(false);
  });

  it('reports OpenHands as available when required env vars are set', () => {
    process.env.OPENHANDS_SERVER_URL = 'https://agent.example.com';
    process.env.OPENHANDS_API_KEY = 'test-key';

    expect(isOpenHandsAvailable()).toBe(true);
  });

  it('throws when asked to send an empty message', async () => {
    process.env.OPENHANDS_SERVER_URL = 'https://agent.example.com';
    process.env.OPENHANDS_API_KEY = 'test-key';

    await expect(runOpenHandsConversation('')).rejects.toThrow(OpenHandsIntegrationError);
  });

  it('creates a new OpenHands conversation when no conversationId is provided', async () => {
    process.env.OPENHANDS_SERVER_URL = 'https://agent.example.com';
    process.env.OPENHANDS_API_KEY = 'test-key';
    process.env.OPENHANDS_LLM_MODEL = 'gpt-4';

    const result = await runOpenHandsConversation('Hello OpenHands');

    expect(mockAgent).toHaveBeenCalledWith({
      llm: {
        model: 'gpt-4',
        api_key: 'test-key',
      },
    });
    expect(mockConversationManager).toHaveBeenCalledWith({
      host: 'https://agent.example.com',
      apiKey: 'test-key',
    });
    expect(result).toEqual({
      conversationId: 'conv-1',
      response: 'Hello from OpenHands',
    });
  });

  it('loads an existing OpenHands conversation when conversationId is provided', async () => {
    process.env.OPENHANDS_SERVER_URL = 'https://agent.example.com';
    process.env.OPENHANDS_API_KEY = 'test-key';

    const result = await runOpenHandsConversation('Continue conversation', 'existing-id');

    expect(mockConversationManager).toHaveBeenCalledWith({
      host: 'https://agent.example.com',
      apiKey: 'test-key',
    });
    expect(mockConversationManager().loadConversation).toHaveBeenCalledWith('existing-id', '/workspace');
    expect(mockConversation.sendMessage).toHaveBeenCalledWith('Continue conversation');
    expect(result).toEqual({
      conversationId: 'conv-1',
      response: 'Hello from OpenHands',
    });
  });
});
