import { apiClient } from "@/api/apiClient";

export interface ChatResponse {
  response: string;
}

export const chatService = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    return apiClient<ChatResponse>("chat/send", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};
