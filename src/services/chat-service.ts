import { apiClient } from "@/api/apiClient";

export interface ChatResponse {
  response: string;
  conversationId: string;
}

export const chatService = {
  sendMessage: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    return apiClient<ChatResponse>("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    });
  },
};
