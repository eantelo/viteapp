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
  CaretDown,
  CaretUp,
  ChatCircle,
  DotsSixVertical,
  PencilSimple,
  PaperPlaneTilt,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { chatService } from "@/services/chat-service";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatDock, type Message } from "@/contexts/ChatDockContext";
import { ChatChart } from "./ChatChart";
import { extractChartData } from "./chat-utils";
import {
  detectProductUpdateFromChatMessage,
  emitProductUpdated,
} from "@/lib/product-events";
import { useInterfaceAgent } from "@/hooks/useInterfaceAgent";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

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
  {
    id: "create-sale",
    text: "Registrar una venta rápida",
  },
];

type MobileChatSnap = "collapsed" | "mid" | "full";

export function ChatWidget() {
  const navigate = useNavigate();
  const {
    isEnabled,
    isOpen,
    chatWidth,
    setChatWidth,
    setIsEnabled,
    minChatWidth,
    maxChatWidth,
    messages,
    setMessages,
    conversationId,
    setConversationId,
    resetConversation,
  } = useChatDock();

  // Interface agent for navigation and action handling
  const {
    processResponse,
    pendingConfirmation,
    confirmAction,
    cancelAction,
    isExecuting,
  } = useInterfaceAgent();
  const isMobile = useIsMobile();

  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileSnap, setMobileSnap] = useState<MobileChatSnap>("collapsed");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const scrollAreaDockedRef = useRef<HTMLDivElement>(null);
  const inputDockedRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  const mobileSheetGestureRef = useRef<{
    startY: number;
    startTime: number;
  } | null>(null);
  const isMobileExpanded = isMobile && mobileSnap !== "collapsed";

  const getNextSnapUp = useCallback((current: MobileChatSnap): MobileChatSnap => {
    if (current === "collapsed") return "mid";
    if (current === "mid") return "full";
    return "full";
  }, []);

  const getNextSnapDown = useCallback(
    (current: MobileChatSnap): MobileChatSnap => {
      if (current === "full") return "mid";
      if (current === "mid") return "collapsed";
      return "collapsed";
    },
    []
  );

  const mobileSnapClass =
    mobileSnap === "full"
      ? "translate-y-0"
      : mobileSnap === "mid"
      ? "translate-y-[calc(100%-26rem)]"
      : "translate-y-[calc(100%-5.25rem)]";

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

  // Scroll automático cuando hay NUEVOS mensajes (evitar scroll en navegación)
  useEffect(() => {
    // Solo hacer scroll si:
    // 1. El chat está abierto
    // 2. Hay MÁS mensajes que antes (nuevo mensaje recibido)
    if (isOpen && messages.length > lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length;
      // Pequeño delay para asegurar que el contenido se haya renderizado
      const timeoutId = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    // Actualizar la referencia incluso si no se hace scroll
    lastMessageCountRef.current = messages.length;
  }, [messages, isOpen, scrollToBottom]);

  // Scroll cuando está cargando (para mostrar el indicador de typing)
  useEffect(() => {
    if (isLoading && isOpen && messages.length > 0) {
      // Solo hacer scroll si realmente hay mensajes que mostrar
      scrollToBottom(true);
    }
  }, [isLoading, isOpen, messages.length, scrollToBottom]);

  useEffect(() => {
    if (!chatPanelRef.current || isMobile) {
      return;
    }

    chatPanelRef.current.style.width = `${chatWidth}px`;
  }, [chatWidth, isMobile]);

  useEffect(() => {
    if (!isEnabled || !isOpen) {
      setMobileSnap("collapsed");
      return;
    }

    if (isMobile) {
      setMobileSnap("mid");
    }
  }, [isEnabled, isMobile, isOpen]);

  const handleNewConversation = () => {
    resetConversation();
    setInputValue("");
  };

  const handleHideAssistant = useCallback(() => {
    setMobileSnap("collapsed");
    setIsEnabled(false);
  }, [setIsEnabled]);

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

      console.log("[ChatWidget] Raw response from API:", response.response);
      console.log(
        "[ChatWidget] Response contains ACTION_DATA:",
        response.response.includes("<<<ACTION_DATA>>>")
      );

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Process interface agent actions first (navigation, form prefill, etc.)
      const agentResult = processResponse(response.response);
      console.log("[ChatWidget] Agent result:", agentResult);

      // Use the cleaned text content (without ACTION_DATA markers)
      const responseToProcess = agentResult.hasAction
        ? agentResult.textContent
        : response.response;

      // Extraer datos del gráfico si existen
      const { chartData, textContent } = extractChartData(responseToProcess);

      // Build final content with feedback message if action was executed
      let finalContent = textContent;
      if (agentResult.hasAction && agentResult.feedbackMessage) {
        // Add a navigation indicator at the start of the message
        const feedbackPrefix = `🚀 *${agentResult.feedbackMessage}*\n\n`;
        finalContent = feedbackPrefix + textContent;
      }

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: finalContent,
        timestamp: new Date().toISOString(),
        chartData: chartData ?? undefined,
      };
      setMessages((prev) => [...prev, systemMessage]);

      // Detectar si la respuesta indica una actualización de producto
      // y emitir el evento correspondiente para que otras páginas se actualicen
      const productUpdate = detectProductUpdateFromChatMessage(textContent);
      console.log(
        "[ChatWidget] Respuesta del chat:",
        textContent.substring(0, 100)
      );
      console.log("[ChatWidget] Actualización detectada:", productUpdate);
      if (productUpdate) {
        console.log(
          "[ChatWidget] Emitiendo evento de actualización de producto"
        );
        emitProductUpdated(productUpdate);
      }
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

  const handleMobileSheetTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      mobileSheetGestureRef.current = {
        startY: touch.clientY,
        startTime: Date.now(),
      };
    },
    []
  );

  const handleMobileSheetTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const gesture = mobileSheetGestureRef.current;
      const touch = event.changedTouches[0];

      if (!gesture || !touch) {
        return;
      }

      const deltaY = touch.clientY - gesture.startY;
      const elapsed = Math.max(Date.now() - gesture.startTime, 1);
      const speed = Math.abs(deltaY) / elapsed;

      const isSwipeUp = deltaY <= -36 || (deltaY < 0 && speed >= 0.55);
      const isSwipeDown = deltaY >= 36 || (deltaY > 0 && speed >= 0.55);

      if (isSwipeUp) {
        setMobileSnap((prev) => getNextSnapUp(prev));
      } else if (isSwipeDown) {
        setMobileSnap((prev) => getNextSnapDown(prev));
      }

      mobileSheetGestureRef.current = null;
    },
    [getNextSnapDown, getNextSnapUp]
  );

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

  // Si el asistente está deshabilitado o el chat no está abierto, no renderizar nada
  if (!isEnabled || !isOpen) {
    return null;
  }

  const chatBody = (
    <>
      <CardContent className="flex-1 overflow-hidden bg-muted/30 p-0 dark:bg-muted/10">
        <ScrollArea className="h-full p-4" ref={scrollAreaDockedRef}>
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-fit max-w-[85%] flex-col gap-1 overflow-hidden rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground shadow-sm dark:border-border border"
                )}
              >
                {msg.role === "system" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.chartData && (
                      <div className="-mx-1 mb-3">
                        <ChatChart chartData={msg.chartData} />
                      </div>
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <table
                            className="my-2 w-full border-collapse text-sm"
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
                          <td className="border-b border-border p-2" {...props} />
                        ),
                        a: ({ node, href, children, ...props }) => {
                          if (href && href.startsWith("/")) {
                            return (
                              <button
                                onClick={() => {
                                  const productMatch = href.match(
                                    /^\/products\/([a-f0-9-]+)$/i
                                  );
                                  if (productMatch) {
                                    const productId = productMatch[1];
                                    navigate(href);
                                    setTimeout(() => {
                                      emitProductUpdated({
                                        productId,
                                        updateType: "updated",
                                        message:
                                          "Navegación desde chat - forzar recarga",
                                      });
                                    }, 100);
                                  } else {
                                    navigate(href);
                                  }
                                }}
                                className="cursor-pointer border-none bg-transparent p-0 font-medium text-primary hover:underline"
                                type="button"
                              >
                                {children}
                              </button>
                            );
                          }
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

            {messages.length === 1 &&
              messages[0]?.id === "welcome" &&
              !isLoading && (
                <div className="mt-4 flex flex-col items-center gap-3 py-6">
                  <p className="text-center text-sm text-muted-foreground">
                    Selecciona una sugerencia o escribe tu pregunta
                  </p>
                  <div className="flex w-full max-w-[320px] flex-col gap-2">
                    {CONVERSATION_SUGGESTIONS.map((suggestion) => (
                      <Button
                        key={suggestion.id}
                        variant="outline"
                        className="h-auto w-full justify-start px-4 py-3 text-left text-sm font-normal transition-colors hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => handleSuggestionClick(suggestion.text)}
                      >
                        {suggestion.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

            {isLoading && (
              <div className="flex w-max max-w-[80%] flex-col gap-1 rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm dark:border-border">
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
      <CardFooter className="border-t bg-card p-4 dark:bg-card md:pb-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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
              <SpinnerGap className="h-4 w-4 animate-spin" weight="bold" />
            ) : (
              <PaperPlaneTilt className="h-4 w-4" weight="bold" />
            )}
          </Button>
        </div>
      </CardFooter>
    </>
  );

  if (isMobile) {
    return (
      <>
        {isMobileExpanded && (
          <div
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setMobileSnap("collapsed")}
            aria-label="Contraer asistente virtual"
          />
        )}

        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex h-[calc(100dvh-4rem)] flex-col rounded-t-2xl border-t bg-background shadow-2xl transition-transform duration-300 ease-out will-change-transform md:hidden",
            mobileSnapClass
          )}
        >
          <Card className="flex h-full flex-col overflow-hidden rounded-t-2xl border-0 bg-background">
            <div
              className="border-b bg-primary px-4 pb-3 pt-2 text-primary-foreground"
              onTouchStart={handleMobileSheetTouchStart}
              onTouchEnd={handleMobileSheetTouchEnd}
            >
              <button
                type="button"
                className="mb-3 flex w-full justify-center touch-none"
                onClick={() =>
                  setMobileSnap((prev) =>
                    prev === "full" ? "collapsed" : getNextSnapUp(prev)
                  )
                }
                aria-label="Cambiar nivel del asistente"
                title="Cambiar nivel del asistente"
              >
                <span className="h-1.5 w-12 rounded-full bg-primary-foreground/40" />
              </button>

              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ChatCircle className="h-5 w-5 shrink-0" weight="bold" />
                    <p className="truncate text-sm font-semibold">
                      Asistente Virtual
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-primary-foreground/80">
                    {mobileSnap === "collapsed"
                      ? "Toca la barra para abrirlo"
                      : "Desliza o usa los controles para expandir o contraer"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={handleNewConversation}
                  title="Nueva conversación"
                  aria-label="Nueva conversación"
                  disabled={isLoading}
                >
                  <PencilSimple className="h-4 w-4" weight="bold" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-40"
                  onClick={() => setMobileSnap((prev) => getNextSnapDown(prev))}
                  title="Contraer asistente"
                  aria-label="Contraer asistente"
                  disabled={mobileSnap === "collapsed"}
                >
                  <CaretDown className="h-4 w-4" weight="bold" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-40"
                  onClick={() => setMobileSnap((prev) => getNextSnapUp(prev))}
                  title="Expandir asistente"
                  aria-label="Expandir asistente"
                  disabled={mobileSnap === "full"}
                >
                  <CaretUp className="h-4 w-4" weight="bold" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={handleHideAssistant}
                  title="Ocultar asistente"
                  aria-label="Ocultar asistente"
                >
                  <X className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>
            {chatBody}
          </Card>
        </div>

        <ConfirmActionDialog
          confirmation={pendingConfirmation}
          onConfirm={confirmAction}
          onCancel={cancelAction}
          isLoading={isExecuting}
        />
      </>
    );
  }

  return (
    <div
      ref={chatPanelRef}
      className="fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] shadow-2xl group-has-data-[collapsible=icon]/sidebar-wrapper:top-12 group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100vh-3rem)]"
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
          <DotsSixVertical className="h-4 w-4 text-muted-foreground" weight="bold" />
        </div>
      </div>
      <Card className="h-full rounded-none border-l border-t-0 border-r-0 border-b-0 border-primary/20 overflow-hidden flex flex-col bg-background">
        <CardHeader className="p-4 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ChatCircle className="h-5 w-5" weight="bold" />
            <CardTitle className="text-base font-semibold">
              Asistente Virtual
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleNewConversation}
              title="Nueva conversación"
              aria-label="Nueva conversación"
              disabled={isLoading}
            >
              <PencilSimple className="h-4 w-4" weight="bold" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleHideAssistant}
              title="Ocultar asistente"
              aria-label="Ocultar asistente"
            >
              <X className="h-4 w-4" weight="bold" />
            </Button>
          </div>
        </CardHeader>
        {chatBody}
      </Card>

      {/* Confirmation dialog for destructive actions */}
      <ConfirmActionDialog
        confirmation={pendingConfirmation}
        onConfirm={confirmAction}
        onCancel={cancelAction}
        isLoading={isExecuting}
      />
    </div>
  );
}
