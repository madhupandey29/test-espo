'use client';

import { useSyncExternalStore } from 'react';

function createUIStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setState(nextStateOrUpdater) {
      const nextState =
        typeof nextStateOrUpdater === 'function'
          ? nextStateOrUpdater(state)
          : nextStateOrUpdater;

      if (Object.is(nextState, state)) {
        return;
      }

      state = nextState;
      listeners.forEach((listener) => listener());
    },
  };
}

const productModalStore = createUIStore({
  productItem: null,
  isModalOpen: false,
  nonce: 0,
});

const shopFilterStore = createUIStore({
  filterSidebar: false,
});

const chatbotStore = createUIStore({
  messages: [],
  isOpen: false,
  isTyping: false,
  sessionId: null,
  userContext: {
    pageUrl: '',
    userAgent: '',
    timestamp: null,
  },
});

export function useProductModalState() {
  return useSyncExternalStore(
    productModalStore.subscribe,
    productModalStore.getSnapshot,
    productModalStore.getSnapshot
  );
}

export function openProductModal(productItem) {
  productModalStore.setState((state) => ({
    productItem,
    isModalOpen: true,
    nonce: state.nonce + 1,
  }));
}

export function closeProductModal() {
  productModalStore.setState((state) => {
    if (!state.isModalOpen && !state.productItem) {
      return state;
    }

    return {
      ...state,
      isModalOpen: false,
      productItem: null,
    };
  });
}

export function useShopFilterState() {
  return useSyncExternalStore(
    shopFilterStore.subscribe,
    shopFilterStore.getSnapshot,
    shopFilterStore.getSnapshot
  );
}

export function openShopFilter() {
  shopFilterStore.setState((state) => {
    if (state.filterSidebar) {
      return state;
    }

    return {
      ...state,
      filterSidebar: true,
    };
  });
}

export function closeShopFilter() {
  shopFilterStore.setState((state) => {
    if (!state.filterSidebar) {
      return state;
    }

    return {
      ...state,
      filterSidebar: false,
    };
  });
}

export function useChatbotState() {
  return useSyncExternalStore(
    chatbotStore.subscribe,
    chatbotStore.getSnapshot,
    chatbotStore.getSnapshot
  );
}

export function toggleChatbotWindow() {
  chatbotStore.setState((state) => ({
    ...state,
    isOpen: !state.isOpen,
  }));
}

export function openChatbotWindow() {
  chatbotStore.setState((state) => {
    if (state.isOpen) {
      return state;
    }

    return {
      ...state,
      isOpen: true,
    };
  });
}

export function closeChatbotWindow() {
  chatbotStore.setState((state) => {
    if (!state.isOpen) {
      return state;
    }

    return {
      ...state,
      isOpen: false,
    };
  });
}

export function addChatbotMessage(message) {
  chatbotStore.setState((state) => ({
    ...state,
    messages: [
      ...state.messages,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...message,
      },
    ],
  }));
}

export function setChatbotTyping(isTyping) {
  chatbotStore.setState((state) => {
    if (state.isTyping === isTyping) {
      return state;
    }

    return {
      ...state,
      isTyping,
    };
  });
}

export function updateChatbotUserContext(context) {
  chatbotStore.setState((state) => ({
    ...state,
    userContext: {
      ...state.userContext,
      ...context,
      timestamp: new Date().toISOString(),
    },
  }));
}

export function setChatbotSessionId(sessionId) {
  chatbotStore.setState((state) => {
    if (state.sessionId === sessionId) {
      return state;
    }

    return {
      ...state,
      sessionId,
    };
  });
}

export function clearChatbotMessages() {
  chatbotStore.setState((state) => {
    if (state.messages.length === 0) {
      return state;
    }

    return {
      ...state,
      messages: [],
    };
  });
}

export function clearChatbotSession() {
  chatbotStore.setState((state) => ({
    ...state,
    messages: [],
    sessionId: null,
    userContext: {
      pageUrl: '',
      userAgent: '',
      timestamp: null,
    },
  }));
}

export function createChatbotMessage(message, additionalData = {}) {
  return {
    message: message || '',
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
    sessionId:
      typeof window !== 'undefined'
        ? sessionStorage.getItem('chatSessionId') ||
          (() => {
            const id = `session_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 11)}`;
            sessionStorage.setItem('chatSessionId', id);
            return id;
          })()
        : null,
    ...additionalData,
  };
}
