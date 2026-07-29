import { createFileRoute } from "@tanstack/react-router";
import { Mic, Send, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { Stars } from "@/components/echoryx/Stars";
import tiger from "@/assets/tiger-mascot.png";
import { RequireAuth, useAuth } from "@/lib/auth";
import { ensureDeviceToken, conversationsApi, type InteractionMessage } from "@/lib/api";

export const Route = createFileRoute("/conversation")({
  head: () => ({
    meta: [
      { title: "AI conversation · EchoRyx" },
      { name: "description", content: "Chat with Niso, your child's AI learning companion." },
      { property: "og:title", content: "AI conversation · EchoRyx" },
      { property: "og:description", content: "Ask Niso anything." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Conversation />
    </RequireAuth>
  ),
});

function Conversation() {
  const { activeChild } = useAuth();
  const activeChildId = activeChild?.id ?? null;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InteractionMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [lastStars, setLastStars] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const startedForChildRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChildId || startedForChildRef.current === activeChildId) return;
    startedForChildRef.current = activeChildId;
    let cancelled = false;

    (async () => {
      try {
        await ensureDeviceToken();
        const result = await conversationsApi.start({ childId: activeChildId, triggerReason: "manual" });
        if (cancelled) return;
        sessionRef.current = result.session.id;
        setSessionId(result.session.id);
        setMessages([result.message]);
      } catch {
        if (!cancelled) setError("Couldn't reach Niso right now. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
      if (sessionRef.current) {
        conversationsApi.end(sessionRef.current).catch(() => undefined);
        sessionRef.current = null;
      }
      startedForChildRef.current = null;
    };
  }, [activeChildId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !sessionId || isThinking) return;
    setInput("");
    setIsThinking(true);
    try {
      const result = await conversationsApi.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, result.childMessage, result.nisoMessage]);
      setLastStars(result.starsAwarded);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <MobileFrame noPadding>
      <div className="relative h-full flex flex-col">
        <Stars />
        <div className="relative px-5 pt-2 pb-3 border-b border-border/40 flex items-center gap-3">
          <ScreenHeader title="Niso" back="/home" right={<span className="text-xs text-success">● Live</span>} />
        </div>
        <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.sender === "child" ? "justify-end" : ""}`}>
              {m.sender === "niso" && <img src={tiger} className="w-8 h-8 rounded-full bg-secondary p-1" alt="" />}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.sender === "child"
                    ? "gradient-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border/60 rounded-bl-sm"
                }`}
              >
                {m.contentText}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex gap-2">
              <img src={tiger} className="w-8 h-8 rounded-full bg-secondary p-1" alt="" />
              <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-twinkle" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
          {lastStars !== null && lastStars > 0 && (
            <p className="text-center text-[11px] text-warning">+{lastStars} stars earned!</p>
          )}
          {error && <p className="text-center text-xs text-destructive">{error}</p>}
        </div>

        <div className="relative px-5 py-3 border-t border-border/40 bg-background/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <button className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center"><Volume2 className="w-5 h-5" /></button>
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-input/60 border border-border">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Say something to Niso…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
            <button className="w-11 h-11 rounded-2xl gradient-primary shadow-glow flex items-center justify-center text-primary-foreground"><Mic className="w-5 h-5" /></button>
            <button onClick={handleSend} className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
