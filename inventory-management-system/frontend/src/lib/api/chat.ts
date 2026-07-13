import { apiClient } from "./client";
import type { ApiResponse } from "../types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  source: "local" | "ai";
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []) {
  const { data } = await apiClient.post<ApiResponse<ChatReply>>("/chat/", {
    message,
    history,
  });
  return data;
}
