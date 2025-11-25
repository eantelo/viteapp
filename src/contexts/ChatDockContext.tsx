import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { ChartData } from "@/components/chat/ChatChart";

// Constantes para los límites del ancho del chat
const MIN_CHAT_WIDTH = 300;
const MAX_CHAT_WIDTH = 800;
const DEFAULT_CHAT_WIDTH = 400;

// Storage keys
const CHAT_STATE_KEY = "chatWidgetState";
const CHAT_MESSAGES_KEY = "chatWidgetMessages";
const CHAT_ENABLED_KEY = "chatWidgetEnabled";

// Mensaje de bienvenida
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "system",
  content:
    "👋 Hola, soy tu asistente de ventas. Puedo ayudarte con consultas sobre productos, ventas, stock y **mostrar gráficos estadísticos**. ¿En qué puedo ayudarte hoy?",
  timestamp: new Date().toISOString(),
};

export interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: string; // ISO string para serialización
  chartData?: ChartData;
}

interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  conversationId?: string;
}

interface ChatDockContextType {
  /** Indica si el asistente virtual está habilitado */
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  isDocked: boolean;
  setIsDocked: (docked: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  chatWidth: number;
  setChatWidth: (width: number) => void;
  minChatWidth: number;
  maxChatWidth: number;
  /** Indica si el chat está visible y acoplado (para calcular el padding del layout) */
  isChatVisibleAndDocked: boolean;
  /** Mensajes del chat persistidos entre navegaciones */
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (message: Message) => void;
  /** ID de conversación del backend */
  conversationId: string | undefined;
  setConversationId: (id: string | undefined) => void;
  /** Reinicia la conversación con el mensaje de bienvenida */
  resetConversation: () => void;
}

const ChatDockContext = createContext<ChatDockContextType | undefined>(
  undefined
);

// Helpers para leer/escribir estado en sessionStorage
function loadChatState(): ChatState {
  try {
    const saved = sessionStorage.getItem(CHAT_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading chat state:", error);
  }
  return { isOpen: false, isMinimized: false };
}

function saveChatState(state: ChatState): void {
  try {
    sessionStorage.setItem(CHAT_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving chat state:", error);
  }
}

function loadMessages(): Message[] {
  try {
    const saved = sessionStorage.getItem(CHAT_MESSAGES_KEY);
    if (saved) {
      const messages = JSON.parse(saved) as Message[];
      // Asegurar que siempre hay al menos el mensaje de bienvenida
      if (messages.length === 0) {
        return [WELCOME_MESSAGE];
      }
      return messages;
    }
  } catch (error) {
    console.error("Error loading chat messages:", error);
  }
  return [WELCOME_MESSAGE];
}

function saveMessages(messages: Message[]): void {
  try {
    sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat messages:", error);
  }
}

export function ChatDockProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabledState] = useState(() => {
    const saved = localStorage.getItem(CHAT_ENABLED_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  const [isDocked, setIsDocked] = useState(() => {
    const saved = localStorage.getItem("chatWidgetDocked");
    return saved ? JSON.parse(saved) : false;
  });

  // Cargar estado persistido desde sessionStorage
  const [chatState, setChatState] = useState<ChatState>(loadChatState);
  const [messages, setMessagesState] = useState<Message[]>(loadMessages);

  const isOpen = chatState.isOpen;
  const isMinimized = chatState.isMinimized;
  const conversationId = chatState.conversationId;

  const setIsOpen = useCallback((open: boolean) => {
    setChatState((prev) => ({ ...prev, isOpen: open }));
  }, []);

  const setIsMinimized = useCallback((minimized: boolean) => {
    setChatState((prev) => ({ ...prev, isMinimized: minimized }));
  }, []);

  const setConversationId = useCallback((id: string | undefined) => {
    setChatState((prev) => ({ ...prev, conversationId: id }));
  }, []);

  const setMessages: React.Dispatch<React.SetStateAction<Message[]>> =
    useCallback((action) => {
      setMessagesState((prev) => {
        const newMessages =
          typeof action === "function" ? action(prev) : action;
        return newMessages;
      });
    }, []);

  const addMessage = useCallback((message: Message) => {
    setMessagesState((prev) => [...prev, message]);
  }, []);

  const resetConversation = useCallback(() => {
    setMessagesState([
      {
        ...WELCOME_MESSAGE,
        id: "welcome",
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatState((prev) => ({ ...prev, conversationId: undefined }));
  }, []);

  const setIsEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    localStorage.setItem(CHAT_ENABLED_KEY, JSON.stringify(enabled));
    // El toggle controla directamente la visibilidad del chat docked
    setChatState((prev) => ({ ...prev, isOpen: enabled, isMinimized: false }));
    // Forzar modo docked cuando está habilitado
    if (enabled) {
      setIsDocked(true);
    }
  }, []);

  // Persistir estado del chat cuando cambia
  useEffect(() => {
    saveChatState(chatState);
  }, [chatState]);

  // Persistir mensajes cuando cambian
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const [chatWidth, setChatWidthState] = useState(() => {
    const saved = localStorage.getItem("chatWidgetWidth");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (
        !isNaN(parsed) &&
        parsed >= MIN_CHAT_WIDTH &&
        parsed <= MAX_CHAT_WIDTH
      ) {
        return parsed;
      }
    }
    return DEFAULT_CHAT_WIDTH;
  });

  const setChatWidth = (width: number) => {
    const clampedWidth = Math.min(
      Math.max(width, MIN_CHAT_WIDTH),
      MAX_CHAT_WIDTH
    );
    setChatWidthState(clampedWidth);
  };

  // Calcular si el chat está visible y acoplado
  const isChatVisibleAndDocked =
    isEnabled && isOpen && !isMinimized && isDocked;

  useEffect(() => {
    localStorage.setItem("chatWidgetDocked", JSON.stringify(isDocked));
  }, [isDocked]);

  useEffect(() => {
    localStorage.setItem("chatWidgetWidth", chatWidth.toString());
  }, [chatWidth]);

  return (
    <ChatDockContext.Provider
      value={{
        isEnabled,
        setIsEnabled,
        isDocked,
        setIsDocked,
        isOpen,
        setIsOpen,
        isMinimized,
        setIsMinimized,
        chatWidth,
        setChatWidth,
        minChatWidth: MIN_CHAT_WIDTH,
        maxChatWidth: MAX_CHAT_WIDTH,
        isChatVisibleAndDocked,
        messages,
        setMessages,
        addMessage,
        conversationId,
        setConversationId,
        resetConversation,
      }}
    >
      {children}
    </ChatDockContext.Provider>
  );
}

export function useChatDock() {
  const context = useContext(ChatDockContext);
  if (context === undefined) {
    throw new Error("useChatDock must be used within a ChatDockProvider");
  }
  return context;
}
