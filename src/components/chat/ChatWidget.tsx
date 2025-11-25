import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  GripVertical,
  RotateCcw,
  SquarePen,
} from "lucide-react";
import { chatService } from "@/services/chat-service";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatDock, type Message } from "@/contexts/ChatDockContext";
import { ChatChart } from "./ChatChart";
import { extractChartData } from "./chat-utils";

// Sugerencias de conversación para mostrar al inicio
const CONVERSATION_SUGGESTIONS = [
  {
    id: "summary-sales",
    text: "Resumen de ventas del día",
  },
  {
    id: "top-products",
    text: "¿Cuáles son los productos más vendidos?",
  },
  {
    id: "inventory-status",
    text: "Estado actual del inventario",
  },
  {
    id: "recent-customers",
    text: "Clientes con compras recientes",
  },
  {
    id: "create-product",
    text: "Crear un nuevo producto",
  },
];

export function ChatWidget() {
  const navigate = useNavigate();
  const {
    isEnabled,
    setIsEnabled,
    isOpen,
    chatWidth,
    setChatWidth,
    minChatWidth,
    maxChatWidth,
    messages,
    setMessages,
    conversationId,
    setConversationId,
    resetConversation,
  } = useChatDock();

  // Si el asistente está deshabilitado, no renderizar nada
  if (!isEnabled) {
    return null;
  }
  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaDockedRef = useRef<HTMLDivElement>(null);
  const inputDockedRef = useRef<HTMLInputElement>(null);

  // Helper para parsear timestamp (puede ser string ISO o Date)
  const parseTimestamp = (timestamp: string | Date): Date => {
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  // Función para hacer scroll al final de los mensajes
  const scrollToBottom = useCallback((smooth = true) => {
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      // Intentar scroll en modo docked
      if (scrollAreaDockedRef.current) {
        const viewport = scrollAreaDockedRef.current.querySelector(
          '[data-slot="scroll-area-viewport"]'
        );
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: smooth ? "smooth" : "instant",
          });
        }
      }
      // Fallback con scrollIntoView
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "instant",
      });
    });
  }, []);

  // Scroll automático cuando cambian los mensajes o se abre el chat
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para asegurar que el contenido se haya renderizado
      const timeoutId = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isOpen, scrollToBottom]);

  // Scroll cuando está cargando (para mostrar el indicador de typing)
  useEffect(() => {
    if (isLoading && isOpen) {
      scrollToBottom(true);
    }
  }, [isLoading, isOpen, scrollToBottom]);

  const handleNewConversation = () => {
    resetConversation();
    setInputValue("");
  };

  // Función auxiliar para enviar un mensaje directamente
  const sendMessageDirect = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(
        userMessage.content,
        conversationId
      );

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Extraer datos del gráfico si existen
      const { chartData, textContent } = extractChartData(response.response);

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: textContent,
        timestamp: new Date().toISOString(),
        chartData: chartData ?? undefined,
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content:
          "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Mantener el foco en el input después de enviar
      requestAnimationFrame(() => {
        inputDockedRef.current?.focus();
      });
    }
  };

  // Manejar clic en sugerencia de conversación
  const handleSuggestionClick = (suggestionText: string) => {
    sendMessageDirect(suggestionText);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const messageToSend = inputValue;
    setInputValue("");
    await sendMessageDirect(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handlers para el resize del panel
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculamos el nuevo ancho desde el borde derecho de la pantalla
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.min(Math.max(newWidth, minChatWidth), maxChatWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Cambiar cursor durante el resize
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setChatWidth, minChatWidth, maxChatWidth]);

  // Si el chat no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] shadow-2xl group-has-data-[collapsible=icon]/sidebar-wrapper:top-12 group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100vh-3rem)]"
      style={{ width: `${chatWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1.5 cursor-col-resize group flex items-center justify-center z-10",
          "hover:bg-primary/20 transition-colors",
          isResizing && "bg-primary/30"
        )}
        onMouseDown={handleResizeStart}
      >
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center",
            "w-4 h-12 rounded-full bg-muted border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity",
            isResizing && "opacity-100"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <Card className="h-full rounded-none border-l border-t-0 border-r-0 border-b-0 border-primary/20 overflow-hidden flex flex-col bg-background">
        <CardHeader className="p-4 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">
              Asistente Virtual
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleNewConversation}
            title="Nueva conversación"
            disabled={isLoading}
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30 dark:bg-muted/10">
          <ScrollArea className="h-full p-4" ref={scrollAreaDockedRef}>
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-fit max-w-[85%] flex-col gap-1 rounded-lg px-3 py-2 text-sm overflow-hidden",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-card border shadow-sm text-card-foreground dark:border-border"
                  )}
                >
                  {msg.role === "system" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {/* Renderizar gráfico si existe */}
                      {msg.chartData && (
                        <div className="mb-3 -mx-1">
                          <ChatChart chartData={msg.chartData} />
                        </div>
                      )}
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <table
                              className="w-full text-sm border-collapse my-2"
                              {...props}
                            />
                          ),
                          thead: ({ node, ...props }) => (
                            <thead
                              className="bg-muted/50 dark:bg-muted/30"
                              {...props}
                            />
                          ),
                          tbody: ({ node, ...props }) => <tbody {...props} />,
                          tr: ({ node, ...props }) => (
                            <tr className="border-b border-border" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              className="border-b border-border p-2 text-left font-medium"
                              {...props}
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              className="border-b border-border p-2"
                              {...props}
                            />
                          ),
                          a: ({ node, href, children, ...props }) => {
                            // Si es un enlace interno (empieza con /), usar button que navega
                            if (href && href.startsWith("/")) {
                              return (
                                <button
                                  onClick={() => {
                                    navigate(href);
                                  }}
                                  className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                                  {...props}
                                >
                                  {children}
                                </button>
                              );
                            }
                            // Para enlaces externos, usar <a> normal con target blank
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <span
                    className={cn(
                      "text-[10px] opacity-70",
                      msg.role === "user"
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {parseTimestamp(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {/* Sugerencias de conversación cuando es una nueva conversación (solo mensaje de bienvenida) */}
              {messages.length === 1 &&
                messages[0]?.id === "welcome" &&
                !isLoading && (
                  <div className="flex flex-col items-center gap-3 py-6 mt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Selecciona una sugerencia o escribe tu pregunta
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-[280px]">
                      {CONVERSATION_SUGGESTIONS.map((suggestion) => (
                        <Button
                          key={suggestion.id}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3 px-4 text-sm font-normal hover:bg-primary/5 hover:border-primary/50 transition-colors"
                          onClick={() => handleSuggestionClick(suggestion.text)}
                        >
                          {suggestion.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              {isLoading && (
                <div className="flex w-max max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2 text-sm bg-card border dark:border-border shadow-sm text-card-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t bg-card dark:bg-card">
          <div className="flex w-full items-center gap-2">
            <Input
              ref={inputDockedRef}
              placeholder="Escribe un mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 focus-visible:ring-1"
              disabled={isLoading}
              autoFocus
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-9 w-9 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
