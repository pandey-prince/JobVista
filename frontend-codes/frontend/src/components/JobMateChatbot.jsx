import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "./ui/button";
import { CHATBOT_API_END_POINT } from "@/utils/constant";
import { useJobMateContext } from "@/context/JobMateContext";

const demoReply = (message = "") => {
  const text = message.toLowerCase();
  if (text.includes("resume")) {
    return "Keep your resume clear and job-focused: summary, skills, projects, education and achievements. Use keywords from the job post.";
  }
  if (text.includes("interview")) {
    return "Practice your introduction, revise your projects, prepare role-specific questions, and answer with examples from your own work.";
  }
  return "I can help with job search guidance, resumes, interviews, cover letters, and tailoring your profile for roles you want.";
};

const normalizeBotText = (text) =>
  text
    .replace(/\s+\*\s+\*\*/g, "\n* **")
    .replace(/\s+\*\s+/g, "\n* ")
    .trim();

const renderInlineText = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });

const renderBotText = (text) => {
  const lines = normalizeBotText(text).split("\n").filter(Boolean);

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
        const content = isBullet ? trimmed.slice(2) : trimmed;

        return (
          <div key={index} className={isBullet ? "flex gap-2" : ""}>
            {isBullet && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
            <span>{renderInlineText(content)}</span>
          </div>
        );
      })}
    </div>
  );
};

const DEFAULT_GREETING =
  "Hi, I am JobMate. I help job seekers with applications, resumes, interviews, and finding roles that match their skills.";

const buildJobGreeting = (jobContext) => {
  if (!jobContext?.title) return DEFAULT_GREETING;

  const company = jobContext.company ? ` at ${jobContext.company}` : "";
  return `Hi, I am JobMate. I can help you understand the ${jobContext.title}${company} role — ask about the job description, interview prep, or how to tailor your application.`;
};

const buildJobSuggestions = (jobContext) => {
  if (!jobContext?.title) {
    return [
      "How do I write a fresher resume?",
      "What are common interview questions?",
      "How should I search for IT jobs?",
    ];
  }

  const role = jobContext.title;
  const company = jobContext.company ? ` at ${jobContext.company}` : "";

  return [
    `Explain this job description for ${role}${company}`,
    `Interview questions for ${role}`,
    `How should I tailor my resume for ${role}?`,
  ];
};

const JobMateChatbot = () => {
  const { jobContext } = useJobMateContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([{ sender: "bot", text: DEFAULT_GREETING }]);

  const suggestions = useMemo(() => buildJobSuggestions(jobContext), [jobContext]);
  const isJobDetailPage = Boolean(jobContext?.jobId);

  useEffect(() => {
    setMessages([{ sender: "bot", text: buildJobGreeting(jobContext) }]);
  }, [jobContext?.jobId, jobContext?.title, jobContext?.company]);

  const sendText = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      setLoading(true);
      const payload = {
        message: trimmed,
      };

      if (jobContext?.title || jobContext?.company) {
        payload.jobTitle = jobContext.title || undefined;
        payload.jobCompany = jobContext.company || undefined;
      }

      const res = await axios.post(`${CHATBOT_API_END_POINT}/message`, payload);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: res.data?.reply || demoReply(trimmed) },
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: demoReply(trimmed) }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    await sendText(message);
  };

  useEffect(() => {
    if (open) {
      // Prefer nearest so the chat panel scrolls without dragging the page to the footer.
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, loading, open]);

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-5">
      {open && (
        <div className="mb-3 flex h-[min(32rem,calc(100vh-7.5rem))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:w-[340px] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between bg-brand px-3 py-3 text-white sm:px-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-semibold leading-tight">JobMate</h2>
                <p className="truncate text-xs text-white/80">
                  {isJobDetailPage && jobContext?.title
                    ? `Helping with ${jobContext.title}`
                    : "Career assistant for job seekers"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-card/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted p-3">
            {messages.map((item, index) => (
              <div
                key={`${item.sender}-${index}`}
                className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] break-words rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[82%] ${
                    item.sender === "user"
                      ? "bg-brand text-white"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {item.sender === "bot" ? renderBotText(item.text) : item.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  JobMate is typing
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {suggestions.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-3 py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => sendText(suggestion)}
                  className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand"
              placeholder={
                isJobDetailPage && jobContext?.title
                  ? "Ask about this role..."
                  : "Ask about resume, interview, or job search..."
              }
            />
            <Button type="submit" size="icon" className="shrink-0 bg-brand hover:bg-brand/90" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-12 w-12 rounded-full bg-brand shadow-lg hover:bg-brand/90 sm:h-14 sm:w-14"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  );
};

export default JobMateChatbot;
