import { useState, useRef, useEffect } from "react";
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
import { MessageCircle, X, Send, Loader2, Minimize2 } from "lucide-react";
import { chatService } from "@/services/chat-service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "Hola, soy tu asistente de ventas. Puedo ayudarte con consultas sobre productos, ventas y stock. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userMessage.content);
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content:
          "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="origin-bottom-right"
          >
            <Card className="w-[350px] shadow-2xl border-primary/20 overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="p-3 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <CardTitle className="text-sm font-medium">
                    Asistente Virtual
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-full p-4">
                  <div className="flex flex-col gap-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex w-fit max-w-[85%] flex-col gap-1 rounded-lg px-3 py-2 text-sm overflow-hidden",
                          msg.role === "user"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-white border shadow-sm text-slate-800"
                        )}
                      >
                        {msg.role === "system" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                        <span
                          className={cn(
                            "text-[10px] opacity-70",
                            msg.role === "user"
                              ? "text-primary-foreground/80"
                              : "text-slate-400"
                          )}
                        >
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex w-max max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2 text-sm bg-white border shadow-sm text-slate-800">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 border-t bg-white">
                <div className="flex w-full items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Escribe un mensaje..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 focus-visible:ring-1"
                    disabled={isLoading}
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
          </motion.div>
        )}
      </AnimatePresence>

      {(!isOpen || isMinimized) && (
        <Button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
}
