"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/lib/api/chat";
import { getErrorMessage } from "@/lib/api/client";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the Bhandar assistant. Ask me about inventory, purchase orders, sales orders, or how to get started.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(text, messages);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: getErrorMessage(error, "Sorry, I could not respond right now."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f2a20] shadow-2xl shadow-black/40 sm:right-8">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Bhandar Assistant</p>
              <p className="text-xs text-white/50">Inventory help · online</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#0b6e4f] text-white"
                      : "bg-white/8 text-white/90"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/8 px-3.5 py-2.5 text-sm text-white/60">
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about inventory..."
                className="flex-1 rounded-xl border border-white/10 bg-[#0a1f17] px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#0b6e4f]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b6e4f] text-white transition hover:bg-[#085340] disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b6e4f] text-white shadow-lg shadow-black/30 transition hover:bg-[#085340] sm:right-8"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
