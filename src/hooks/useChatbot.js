import { useCallback, useEffect, useState } from 'react';
import {
  addChatbotMessage,
  clearChatbotMessages,
  closeChatbotWindow,
  createChatbotMessage,
  openChatbotWindow,
  setChatbotSessionId,
  setChatbotTyping,
  toggleChatbotWindow,
  updateChatbotUserContext,
  useChatbotState,
} from '../lib/ui-state-store';
import { getApiBaseUrl } from '../utils/runtimeConfig';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || 'x-api-key';

function getChatApiBase() {
  const apiBase = getApiBaseUrl();

  if (!apiBase) {
    throw new Error('API base URL is not configured.');
  }

  return apiBase;
}

async function sendChatbotMessageRequest(messageData) {
  const apiBase = getChatApiBase();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers[API_KEY_HEADER] = API_KEY;
  }

  const response = await fetch(`${apiBase}/chat/message`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      message: messageData.message,
      pageUrl: messageData.pageUrl,
      userAgent: messageData.userAgent,
      timestamp: messageData.timestamp,
      sessionId: messageData.sessionId,
      context: messageData.context || {},
    }),
  });

  const responseText = await response.text();
  let payload = {};

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { content: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Chat request failed: ${response.status}`);
  }

  return {
    id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    type: 'bot',
    content: payload.replyText || payload.message || payload.content || responseText,
    timestamp: new Date().toISOString(),
    suggestions: payload.suggestions || [],
    meta: payload.meta || {},
    ...payload,
  };
}

export const useChatbot = () => {
  const chatbot = useChatbotState();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('chatSessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 11)}`;
        sessionStorage.setItem('chatSessionId', sessionId);
      }
      setChatbotSessionId(sessionId);

      updateChatbotUserContext({
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      updateChatbotUserContext({
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }, []);

  const sendMessage = useCallback(
    async (messageText, additionalContext = {}) => {
      if (!messageText.trim()) return;

      const userMessage = {
        type: 'user',
        content: messageText,
        context: additionalContext,
      };
      addChatbotMessage(userMessage);

      const messageData = createChatbotMessage(messageText, {
        sessionId: chatbot.sessionId,
        context: {
          ...chatbot.userContext,
          ...additionalContext,
        },
      });

      try {
        setChatbotTyping(true);
        setIsSending(true);

        const response = await sendChatbotMessageRequest(messageData);

        addChatbotMessage({
          type: 'bot',
          content: response.content || response.replyText,
          suggestions: response.suggestions || [],
          meta: response.meta || {},
          ...response,
        });
      } catch (error) {
        console.error('Chat error:', error);
        addChatbotMessage({
          type: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          error: true,
        });
      } finally {
        setChatbotTyping(false);
        setIsSending(false);
      }
    },
    [chatbot.sessionId, chatbot.userContext]
  );

  const toggleChatbot = useCallback(() => {
    toggleChatbotWindow();
  }, []);

  const openChatbot = useCallback(() => {
    openChatbotWindow();
  }, []);

  const closeChatbot = useCallback(() => {
    closeChatbotWindow();
  }, []);

  const clearChat = useCallback(() => {
    clearChatbotMessages();
  }, []);

  return {
    messages: chatbot.messages,
    isOpen: chatbot.isOpen,
    isTyping: chatbot.isTyping || isSending,
    sessionId: chatbot.sessionId,
    userContext: chatbot.userContext,
    sendMessage,
    toggleChatbot,
    openChatbot,
    closeChatbot,
    clearChat,
    createMessage: createChatbotMessage,
  };
};
