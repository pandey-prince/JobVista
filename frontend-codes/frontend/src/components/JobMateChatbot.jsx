import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "./ui/button";
import { CHATBOT_API_END_POINT } from "@/utils/constant";

const demoReply = (message = "") => {
  const text = message.toLowerCase();
  if (text.includes("resume")) {
    return "Keep your resume clear and job-focused: summary, skills, projects, education and achievements. Use keywords from the job post.";
  }
  if (text.includes("interview")) {
    return "Practice your introduction, revise your projects, prepare role-specific questions, and answer with examples from your own work.";
  }
  if (text.includes("recruiter") || text.includes("job post")) {
    return "Mention role, responsibilities, required skills, experience, location, salary range and application steps in the job post.";
  }
  return "I can help with job search guidance, resumes, interviews, cover letters, job posts and candidate screening questions.";
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

const JobMateChatbot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi, I am JobMate. I help job seekers with applications, resumes and interviews, and recruiters with job posts and screening questions.",
    },
  ]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: "user", text: message.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      setLoading(true);
      const res = await axios.post(`${CHATBOT_API_END_POINT}/message`, {
        message: userMessage.text,
      });
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: res.data?.reply || demoReply(userMessage.text) },
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: demoReply(userMessage.text) }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading, open]);

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-5 sm:right-5">
      {open && (
        <div className="mb-3 flex h-[min(32rem,calc(100vh-7.5rem))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:w-[340px] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between bg-brand px-3 py-3 text-white sm:px-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-semibold leading-tight">JobMate</h2>
                <p className="truncate text-xs text-white/80">Career and recruiter assistant</p>
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

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand"
              placeholder="Ask about resume, interview, job post..."
            />
            <Button type="submit" size="icon" className="shrink-0 bg-brand hover:bg-brand/90">
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
