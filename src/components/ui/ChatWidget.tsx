'use client';

/**
 * ChatWidget — streaming AI chat interface for the Imperial Codex dashboard.
 *
 * Uses Vercel AI SDK useChat hook for streaming responses.
 * Supports conversation persistence via conversationId.
 * Responsive layout (375px–2560px).
 */

import { useChat } from '@/hooks/useChat';
import { useState, useRef, useEffect } from 'react';

interface ChatWidgetProps {
  /** Pre-loaded conversation ID from the server (most recent session) */
  initialConversationId?: string;
}

export function ChatWidget({ initialConversationId }: ChatWidgetProps) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/agent/chat',
    body: { conversationId },
    onResponse: (response) => {
      // Capture the conversation ID from the response header
      const newConvId = response.headers.get('X-Conversation-Id');
      if (newConvId && !conversationId) {
        setConversationId(newConvId);
      }
    },
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col"
      style={{ width: 'min(400px, calc(100vw - 2rem))' }}
      role="complementary"
      aria-label="Imperial Codex AI Assistant"
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="self-end mb-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        aria-expanded={isOpen}
        aria-controls="chat-panel"
      >
        {isOpen ? '✕ Close' : '⚡ Codex AI'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          id="chat-panel"
          className="flex flex-col bg-gray-950 border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
          style={{ height: 'min(500px, 70vh)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
            <h2 className="text-white text-sm font-semibold">Imperial Codex AI</h2>
            <p className="text-gray-400 text-xs">Strategic intelligence assistant</p>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.length === 0 && (
              <p className="text-gray-500 text-sm text-center mt-8">
                Ask about Pillars, OS Modules, Library entries, or request a Strike Output.
              </p>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                  role={message.role === 'assistant' ? 'article' : undefined}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 rounded-lg px-3 py-2 text-sm">
                  <span aria-label="Loading response">Thinking…</span>
                </div>
              </div>
            )}

            {error && (
              <div
                className="bg-red-900 border border-red-700 text-red-200 rounded-lg px-3 py-2 text-sm"
                role="alert"
              >
                {error.message || 'An error occurred. Please try again.'}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-gray-700 flex gap-2"
          >
            <label htmlFor="chat-input" className="sr-only">
              Message the Imperial Codex AI
            </label>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the Codex…"
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
