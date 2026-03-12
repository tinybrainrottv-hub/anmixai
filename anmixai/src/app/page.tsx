"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  File, 
  Sparkles,
  ArrowUpRight,
  User,
  Eye,
  Download,
  Menu,
  X,
  Search,
  Bell,
  Calendar,
  CreditCard,
  BarChart3,
  Code2,
  LogOut,
  RefreshCcw,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LightRays from "@/components/LightRays";
import ChatInput, { VoiceButton } from "@/components/ChatInput";
import FormattedMessage from "@/components/FormattedMessage";
import { ReasoningBlock } from "@/components/prompt-kit/reasoning";
import dynamic from "next/dynamic";
import { EyeCatchingButton_v1 } from "@/components/ui/eye-catching-button";
import AnimatedBadge from "@/components/ui/animated-badge";
import { SparklesText } from "@/components/ui/sparkles-text";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { AnimatedShinyButton } from "@/components/eldoraui/animated-shiny-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { RainbowButton } from "@/registry/magicui/rainbow-button";
import { PearlSignUpButton } from "@/components/ui/pearl-signup-button";
import GradientButton from "@/components/ui/gradient-button";
import CopyButton from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";
import AILoader from "@/components/ui/ai-loader";
import {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/basic-dropdown";
import Link from "next/link";
import { useUser, useClerk, SignUp, SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CookiePanel } from "@/components/ui/cookie-banner-1";
import { ImageGeneration } from "@/components/ui/ai-chat-image-generation-1";
import { CardCanvas, Card } from "@/components/ui/animated-glow-card";

const VoiceAgentClient = dynamic(() => import("@/components/VoiceAgentClient"), {
  ssr: false,
});

interface FilePreview {
  type: "image" | "text" | "pdf" | "video";
  name: string;
  size: string;
  desc: string;
  url?: string;
  status?: "generating" | "done";
  prompt?: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  previews?: FilePreview[];
  kind?: "text" | "image" | "video";
  reasoning?: string;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
}

interface SavedCard {
  name: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

const AnimatedWords = ({ text }: { text: string }) => {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={word + index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.35 }}
          className="inline-block"
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </>
  );
};

export default function AnmixDashboard() {
  const [showIntro, setShowIntro] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("ANMIX-V0.1 BEST");
  const scrollRef = useRef<HTMLDivElement>(null);

  const GROQ_MODELS = [
    "ANMIX-V0.1 BEST",
    "ANMIX-V0.5 CODING THINKING",
  ];

  const IMAGE_MODELS_FOR_CHAT = [
    "ANMIX-PRO",
    "ANMIX-GEN",
    "ANMIX-BETA",
    "ANMIX-HGEN",
    "ANMIX-PRO-V2",
  ];
  const VIDEO_MODELS_FOR_CHAT = ["ANMIX-VEA-0.1"];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);

  // Optional scroll helper (currently not auto-scrolling; user controls position)
  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
        block: "end",
      });
    }
  };

  const handleSendMessage = async (customMsg?: string, previews?: FilePreview[]) => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (isTyping) return;
    const messageToSend = customMsg || input;
    if (!messageToSend.trim() && !previews) return;

    // Image-only modes (generate / editor)
    if (false) {
      if (messages.length === 0 && !activeSessionId) {
        setActiveSessionId(Date.now());
      }

      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        content: messageToSend,
        previews,
        kind: "text",
      };

      const assistantMsgId = Date.now() + 1;
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        kind: "image",
        previews: [
          {
            type: "image",
            name: "enhanced-image.jpeg",
            size: "",
            desc: "enhanced",
            status: "generating",
            prompt: messageToSend,
          },
        ],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsTyping(true);

      let maybeImageUrl: string | undefined;
      const imgPreview = previews?.find((p) => p.type === "image");
      if (imgPreview) {
        if ((imgPreview as any).file) {
          try {
            const fd = new FormData();
            fd.append("file", (imgPreview as any).file);
            const uploadRes = await fetch("/api/upload-image", {
              method: "POST",
              body: fd,
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData?.url) {
              throw new Error(uploadData?.error || "Failed to upload image");
            }
            maybeImageUrl = uploadData.url;
          } catch (upErr) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: "Failed to upload image. Please try again.",
                      kind: "text" as const,
                      previews: undefined,
                    }
                  : m,
              ),
            );
            setIsTyping(false);
            return;
          }
        } else if (imgPreview.url && /^https?:\/\//.test(imgPreview.url)) {
          maybeImageUrl = imgPreview.url;
        }
      }

      if (!maybeImageUrl) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: "Please upload an image to enhance.",
                  kind: "text" as const,
                  previews: undefined,
                }
              : m,
          ),
        );
        setIsTyping(false);
        return;
      }

      try {
        const res = await fetch("/api/claid/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: maybeImageUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) {
          throw new Error(
            typeof data?.error === "string"
              ? data.error
              : "Image enhancement failed.",
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  previews: [
                    {
                      type: "image",
                      name: "enhanced-image.jpeg",
                      size: "",
                      desc: "enhanced",
                      url: data.url,
                      status: "done",
                      prompt: messageToSend,
                    },
                  ],
                }
              : m,
          ),
        );
      } catch (e) {
        const errMessage =
          e instanceof Error
            ? e.message
            : "Image enhancement failed. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: errMessage,
                  kind: "text",
                  previews: undefined,
                }
              : m,
          ),
        );
      } finally {
        setIsTyping(false);
      }

      return;
    }

    if (chatMode === "image-gen" || chatMode === "image-edit") {
      // Starting a brand new chat session
      if (messages.length === 0 && !activeSessionId) {
        setActiveSessionId(Date.now());
      }

      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        content: messageToSend,
        previews,
        kind: "text",
      };

      const assistantMsgId = Date.now() + 1;
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        kind: "image",
        previews: [
          {
            type: "image",
            name: "generated-asset.png",
            size: "",
            desc: "generated",
            status: "generating",
            prompt: messageToSend,
          },
        ],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsTyping(true);

      // Pollinations (gen.pollinations.ai) model IDs
      const modelMap: Record<string, string> = {
        "ANMIX-PRO": "gptimage",
        "ANMIX-GEN": "imagen-4",
        "ANMIX-BETA": "grok-imagine",
        "ANMIX-HGEN": "klein",
        "ANMIX-PRO-V2": "klein-large",
      };

      const apiModel = modelMap[selectedModel] || "klein";

      // For editor mode: upload blob images to get public URL, or use existing https URL
      let maybeImageUrl: string | undefined;
      const imgPreview = previews?.find((p) => p.type === "image");
      if (imgPreview) {
        if ((imgPreview as any).file) {
          try {
            const fd = new FormData();
            fd.append("file", (imgPreview as any).file);
            const uploadRes = await fetch("/api/upload-image", { method: "POST", body: fd });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData?.url) {
              throw new Error(uploadData?.error || "Failed to upload image");
            }
            maybeImageUrl = uploadData.url;
          } catch (upErr) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: "Failed to upload image. Please try again.", kind: "text" as const, previews: undefined }
                  : m
              )
            );
            setIsTyping(false);
            return;
          }
        } else if (imgPreview.url && /^https?:\/\//.test(imgPreview.url)) {
          maybeImageUrl = imgPreview.url;
        }
      }
      if (!maybeImageUrl && chatMode === "image-edit") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "Please upload an image to edit.", kind: "text" as const, previews: undefined }
              : m
          )
        );
        setIsTyping(false);
        return;
      }

      try {
        const res = await fetch("/api/pollinations/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: apiModel,
            prompt: messageToSend,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = typeof data?.error === "string" ? data.error : "Image generation failed. Try another model or prompt.";
          throw new Error(errMsg);
        }
        if (!data?.url) {
          throw new Error(
            typeof data?.error === "string" ? data.error : "No image returned. Try another model or prompt.",
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  previews: [
                    {
                      type: "image",
                      name: "generated-asset.png",
                      size: "",
                      desc: "generated",
                      url: data.url,
                      status: "done",
                      prompt: messageToSend,
                    },
                  ],
                }
              : m,
          ),
        );
      } catch (e) {
        const errMessage = e instanceof Error ? e.message : "Image generation failed. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: errMessage,
                  kind: "text",
                  previews: undefined,
                }
              : m,
          ),
        );
      } finally {
        setIsTyping(false);
      }

      return;
    }

    if (chatMode === "video-gen") {
      if (messages.length === 0 && !activeSessionId) setActiveSessionId(Date.now());
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        content: messageToSend,
        previews,
        kind: "text",
      };
      const assistantMsgId = Date.now() + 1;
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        kind: "video",
        previews: [
          {
            type: "video",
            name: "generated-video.mp4",
            size: "",
            desc: "generated",
            status: "generating",
            prompt: messageToSend,
          },
        ],
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsTyping(true);

      try {
        let referenceImageUrl: string | null = null;
        const imgPreview = previews?.find((p: any) => p.type === "image");
        if (imgPreview) {
          if ((imgPreview as any).file) {
            const fd = new FormData();
            fd.append("file", (imgPreview as any).file);
            const uploadRes = await fetch("/api/upload-image", { method: "POST", body: fd });
            const uploadData = await uploadRes.json().catch(() => ({}));
            if (uploadData?.url) referenceImageUrl = uploadData.url;
          } else if ((imgPreview as any).url && String((imgPreview as any).url).startsWith("http")) {
            referenceImageUrl = (imgPreview as any).url;
          }
        }
        const res = await fetch("/api/ximagine/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: messageToSend,
            ...(referenceImageUrl && { referenceImageUrl }),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Video generation failed.");
        }
        const videoUrl = data?.url;
        if (!videoUrl || typeof videoUrl !== "string") {
          throw new Error("No video URL returned.");
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  previews: [
                    {
                      type: "video",
                      name: "generated-video.mp4",
                      size: "",
                      desc: "generated",
                      url: videoUrl,
                      status: "done",
                      prompt: messageToSend,
                    },
                  ],
                }
              : m
          )
        );
      } catch (e) {
        const errMessage = e instanceof Error ? e.message : "Video generation failed. Try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: errMessage, kind: "text" as const, previews: undefined }
              : m
          )
        );
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Starting a brand new chat session
    if (messages.length === 0 && !activeSessionId) {
      setActiveSessionId(Date.now());
    }

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: messageToSend,
      previews: previews,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // For second and later messages, scroll chat to the new message position
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 0);
    }

    const nowIso = new Date().toISOString();
    const timeZone =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "local";

    const looksLikeImageQuestion = (text: string) => {
      const t = (text || "").toLowerCase();
      return (
        /(describe|explain|what is|what's|who is|who's|tell me|about this|in this|is this)/.test(t) ||
        /(kya|kaun|kis|yeh|ye|is photo|iss photo|is image|iss image|isme|isme kya|describe karo|batao)/.test(t)
      );
    };

    const getPublicImageUrlFromPreviews = async () => {
      const img = previews?.find((p) => p.type === "image") as any;
      if (!img) return null;
      if (typeof img.url === "string" && /^https?:\/\//.test(img.url)) return img.url as string;

      // If it's a blob/object URL, upload to get a public HTTPS URL
      if (img.file) {
        const fd = new FormData();
        fd.append("file", img.file);
        const uploadRes = await fetch("/api/upload-image", { method: "POST", body: fd });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadData?.url) return null;
        return uploadData.url as string;
      }

      return null;
    };

    // If user attached an image and asked about it, use the hidden vision model (no selector)
    if (
      chatMode === "chat" &&
      previews?.some((p) => p.type === "image") &&
      looksLikeImageQuestion(messageToSend)
    ) {
      try {
        const publicUrl = await getPublicImageUrlFromPreviews();
        if (publicUrl) {
          const response = await fetch("/api/groq/describe-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: publicUrl,
              question: messageToSend,
              nowIso,
              timeZone,
            }),
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok || typeof data?.content !== "string") {
            throw new Error("Describe-image call failed");
          }

          const assistantMsg: Message = {
            id: Date.now() + 1,
            role: "assistant",
            content: data.content,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.error("Groq describe-image error:", err);
        // fall back to normal chat below
      }
    }

    // Use Groq API for all AI chat models (ANMIX-V0.1 BEST, ANMIX-V0.5 CODING THINKING)
    if (GROQ_MODELS.includes(selectedModel)) {
      try {
        const response = await fetch("/api/groq/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            nowIso,
            timeZone,
            messages: [
              ...messages.map((m) => ({
                role: m.role,
                content: typeof m.content === "string" ? m.content : "",
              })),
              { role: "user", content: messageToSend },
            ],
          }),
        });

        const data = await response.json().catch(() => ({}));
        const apiContent = data?.content;
        if (!response.ok) {
          const errMsg =
            typeof data?.error === "string"
              ? data.error
              : data?.error?.message
                ? String(data.error.message)
                : response.status === 401
                  ? "Invalid API key. Check .env.local"
                  : response.status === 429
                    ? "Too many requests. Try again in a moment."
                    : `Request failed (${response.status}). Try again.`;
          throw new Error(errMsg);
        }
        if (typeof apiContent !== "string") {
          throw new Error(typeof data?.error === "string" ? data.error : "No response from AI. Try again.");
        }

        const assistantMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: apiContent,
          ...(typeof data.reasoning === "string" && data.reasoning.trim() && { reasoning: data.reasoning.trim() }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        console.error("Groq API Error:", error);
        const errMsg = error instanceof Error ? error.message : "AI request failed. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: errMsg,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Simulate AI Response for other models (fallback)
    setTimeout(() => {
      const responses = [
        "I've analyzed your request and I'm ready to help. What specific details would you like to explore first?",
        "That's an interesting perspective. Based on current trends, we could approach this from several angles.",
        "Understood. I'm processing that information now. Would you like me to generate a summary or dive deeper into the technical aspects?",
        "I can certainly help with that. Here's what I've found so far...",
      ];
      
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };

      if (Math.random() > 0.7) {
        assistantMsg.previews = [
          { type: "image", name: "generated-asset.png", size: "1.2 MB", desc: "AI generated visual." },
          { type: "text", name: "notes.md", size: "2 KB", desc: "Extracted insights." }
        ];
      }

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const clearChat = () => {
    setIsTyping(false);
    if (messages.length > 0) {
      const newSession: ChatSession = {
        id: activeSessionId || Date.now(),
        title:
          messages[0].role === "user"
            ? messages[0].content.slice(0, 30)
            : "New Chat",
        messages: [...messages],
      };
      setChatHistory((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === newSession.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newSession;
          return updated;
        }
        return [newSession, ...prev];
      });
    }
    setMessages([]);
    setActiveSessionId(null);
  };

  const startImageChat = () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    setVoiceMode(false);
    setVoiceAgentActive(false);
    setChatMode("image-gen");
    setSelectedModel("ANMIX-PRO-V2");
    setSidebarOpen(false);
  };

  const startVoiceChatSession = () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    setIsTyping(false);
    if (messages.length > 0) {
      const newSession: ChatSession = {
        id: activeSessionId || Date.now(),
        title: "Voice Chat",
        messages: [...messages],
      };
      setChatHistory((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === newSession.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newSession;
          return updated;
        }
        return [newSession, ...prev];
      });
    }
    setMessages([]);
    setActiveSessionId(null);
    setChatMode("chat");
    setSelectedModel("ANMIX-V0.1 BEST");
    setVoiceMode(true);
    setVoiceAgentActive(false);
  };

  const loadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveSessionId(session.id);
    setVoiceMode(false);
    setVoiceAgentActive(false);
    setChatMode("chat");
    // Mark all completed images/videos as already revealed so they don't re-animate
    setRevealedImageIds((prev) => {
      const next = new Set(prev);
      session.messages.forEach((m) => {
        if (m.role === "assistant" && m.kind === "image" && m.previews?.some((p: any) => p.status === "done" && p.url)) {
          next.add(m.id);
        }
      });
      return next;
    });
    setRevealedVideoIds((prev) => {
      const next = new Set(prev);
      session.messages.forEach((m) => {
        if (m.role === "assistant" && m.kind === "video" && m.previews?.some((p: any) => p.status === "done" && p.url)) {
          next.add(m.id);
        }
      });
      return next;
    });
  };

  const handleRegenerate = (assistantIndex: number) => {
    const target = messages[assistantIndex];
    if (!target || target.role !== "assistant") return;
    const previousUser = [...messages]
      .slice(0, assistantIndex)
      .reverse()
      .find((m) => m.role === "user");
    if (!previousUser) return;
    // Re-ask same question to get a fresh answer
    handleSendMessage(previousUser.content);
  };

  const extractPromptKeywords = (prompt: string, maxWords = 3) => {
    const stop = new Set([
      "a","an","the","and","or","to","of","in","on","at","with","for","from","into","this","that","these","those",
      "make","create","generate","image","photo","picture","please","bro","convert",
    ]);
    const parts = (prompt || "")
      .split(/[^a-zA-Z0-9]+/g)
      .map((w) => w.trim())
      .filter(Boolean);
    const keywords: string[] = [];
    for (const w of parts) {
      const lw = w.toLowerCase();
      if (lw.length <= 2) continue;
      if (stop.has(lw)) continue;
      keywords.push(w.toUpperCase());
      if (keywords.length >= maxWords) break;
    }
    return keywords.length ? keywords.join("-") : "IMAGE";
  };

  const buildGeneratedFilename = (prompt: string) => {
    const kw = extractPromptKeywords(prompt, 3);
    return `ANMIX-AI-${kw}.png`;
  };

  const buildGeneratedVideoFilename = (prompt: string) => {
    const kw = extractPromptKeywords(prompt, 3);
    return `ANMIX-AI-VIDEO-${kw}.mp4`;
  };

  const downloadGeneratedVideo = async (url: string, prompt: string) => {
    try {
      const filename = buildGeneratedVideoFilename(prompt || "video");
      const res = await fetch("/api/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, filename }),
      });
      if (!res.ok) throw new Error("Failed to fetch video");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // ignore
    }
  };

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });

  const downloadGeneratedImage = async (url: string, prompt: string) => {
    try {
      const filename = buildGeneratedFilename(prompt || "image");

      // 1) Fetch original image via server proxy to avoid CORS
      const baseRes = await fetch("/api/download-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, filename }),
      });
      if (!baseRes.ok) throw new Error("failed to fetch base image");
      const baseBlob = await baseRes.blob();

      // 2) Fetch watermark asset (must exist in /public)
      const wmRes = await fetch("/anmix-ai-watermark.png");
      if (!wmRes.ok) throw new Error("failed to fetch watermark");
      const wmBlob = await wmRes.blob();

      // 3) Draw on canvas: base image + bottom-right watermark
      const baseUrl = URL.createObjectURL(baseBlob);
      const wmUrl = URL.createObjectURL(wmBlob);
      const baseImg = await loadImage(baseUrl);
      const wmImg = await loadImage(wmUrl);

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas context");

      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Watermark size ~14% of width, keep aspect ratio
      const scale = 0.14;
      const targetW = canvas.width * scale;
      const ratio = wmImg.width / wmImg.height || 1;
      const targetH = targetW / ratio;
      const pad = Math.max(8, canvas.width * 0.02);

      // Blend so watermark's black becomes transparent-ish
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(
        wmImg,
        canvas.width - targetW - pad,
        canvas.height - targetH - pad,
        targetW,
        targetH,
      );
      ctx.restore();

      URL.revokeObjectURL(baseUrl);
      URL.revokeObjectURL(wmUrl);

      const finalBlob: Blob | null = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.95),
      );
      const finalUrl = URL.createObjectURL(finalBlob);

      const a = document.createElement("a");
      a.href = finalUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(finalUrl);
    } catch {
      // ignore errors silently
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [chatMode, setChatMode] = useState<"chat" | "image-gen" | "image-edit" | "video-gen">("chat");
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [showClerkAuthModal, setShowClerkAuthModal] = useState(false);
  const [clerkAuthMode, setClerkAuthMode] = useState<"signup" | "signin">("signup");
  const router = useRouter();
  const [usageOpen, setUsageOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [imageEditorComingSoonOpen, setImageEditorComingSoonOpen] = useState(false);
  const [imageEnhancerComingSoonOpen, setImageEnhancerComingSoonOpen] = useState(false);
  const [voiceTextComingSoonOpen, setVoiceTextComingSoonOpen] = useState(false);
  const [revealedImageIds, setRevealedImageIds] = useState<Set<number>>(new Set());
  const [revealedVideoIds, setRevealedVideoIds] = useState<Set<number>>(new Set());
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [imageViewerPrompt, setImageViewerPrompt] = useState<string>("");
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [videoViewerUrl, setVideoViewerUrl] = useState<string | null>(null);
  const videoViewerRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardDefault, setCardDefault] = useState(true);
  const [cardNameError, setCardNameError] = useState("");
  const [cardNumberError, setCardNumberError] = useState("");
  const [cardExpiryError, setCardExpiryError] = useState("");
  const [cardCvcError, setCardCvcError] = useState("");
  const [messageReactions, setMessageReactions] = useState<Record<number, "up" | "down" | null>>(
    {},
  );
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceAgentActive, setVoiceAgentActive] = useState(false);
  const [pendingImagePreviews, setPendingImagePreviews] = useState<{ url: string; name: string }[]>([]);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("anmix-desktop-sidebar-collapsed");
      if (raw === "1") setDesktopSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(
          "anmix-desktop-sidebar-collapsed",
          next ? "1" : "0",
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const openImageGenChat = () => {
    setChatMode("image-gen");
    setSelectedModel("ANMIX-PRO-V2");
    setSidebarOpen(false);
  };

  const openChatHistory = () => {
    // In collapsed mode, tapping history expands sidebar so titles are readable
    setDesktopSidebarCollapsed(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    if (hour < 22) return "Good evening";
    return "Good night";
  };

  const greeting = getGreeting();
  const displayGreetingName =
    !isSignedIn || !user
      ? "Bro"
      : user.firstName ||
        user.username ||
        user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "Friend";

  const handleVoiceConversationText = (payload: { role: string; content: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: payload.role === "assistant" ? "assistant" : "user",
        content: payload.content,
      },
    ]);
  };

  useEffect(() => {
    if (chatMode !== "image-edit") {
      setPendingImagePreviews([]);
    }
  }, [chatMode]);

  // Prevent long-press "Save Image" on mobile in image viewer (passive: false required for preventDefault)
  useEffect(() => {
    const el = imageViewerRef.current;
    if (!el) return;
    const preventTouch = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchstart", preventTouch, { passive: false });
    el.addEventListener("touchmove", preventTouch, { passive: false });
    el.addEventListener("touchend", preventTouch, { passive: false });
    el.addEventListener("touchcancel", preventTouch, { passive: false });
    return () => {
      el.removeEventListener("touchstart", preventTouch);
      el.removeEventListener("touchmove", preventTouch);
      el.removeEventListener("touchend", preventTouch);
      el.removeEventListener("touchcancel", preventTouch);
    };
  }, [imageViewerOpen, imageViewerUrl]);

  useEffect(() => {
    const el = videoViewerRef.current;
    if (!el) return;
    const preventTouch = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchstart", preventTouch, { passive: false });
    el.addEventListener("touchmove", preventTouch, { passive: false });
    el.addEventListener("touchend", preventTouch, { passive: false });
    el.addEventListener("touchcancel", preventTouch, { passive: false });
    return () => {
      el.removeEventListener("touchstart", preventTouch);
      el.removeEventListener("touchmove", preventTouch);
      el.removeEventListener("touchend", preventTouch);
      el.removeEventListener("touchcancel", preventTouch);
    };
  }, [videoViewerOpen, videoViewerUrl]);

  // Close Clerk auth modal when user signs in/up
  useEffect(() => {
    if (user && showClerkAuthModal) setShowClerkAuthModal(false);
  }, [user, showClerkAuthModal]);

  // Instant chat history: sync current session to chatHistory as soon as any message is sent
  useEffect(() => {
    if (messages.length === 0 || !activeSessionId) return;
    const firstUser = messages.find((m) => m.role === "user");
    const title =
      voiceMode
        ? "Voice Chat"
        : chatMode === "image-gen"
          ? (firstUser?.content?.slice(0, 30) || "Image generation")
          : chatMode === "image-edit"
            ? (firstUser?.content?.slice(0, 30) || "Image editor")
            : chatMode === "video-gen"
              ? (firstUser?.content?.slice(0, 30) || "Video generation")
              : (firstUser?.content?.slice(0, 30) || "New Chat");
    const session: ChatSession = {
      id: activeSessionId,
      title: title.trim() || "New Chat",
      messages: [...messages],
    };
    setChatHistory((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = session;
        return updated;
      }
      return [session, ...prev];
    });
  }, [messages, activeSessionId, chatMode, voiceMode]);

  // Load chat history (Supabase only if table is enabled via env; otherwise localStorage)
  const useSupabaseChat = process.env.NEXT_PUBLIC_SUPABASE_CHAT_HISTORY === "true";

  useEffect(() => {
    if (!isLoaded) return;

    const load = async () => {
      // Supabase only when explicitly enabled (requires user_chats table in Supabase)
      if (useSupabaseChat && isSignedIn && user && supabase) {
        try {
          const { data, error } = await supabase
            .from("user_chats")
            .select("history")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!error && data?.history && Array.isArray(data.history)) {
            setChatHistory(data.history as ChatSession[]);
            return;
          }
        } catch {
          // fall back to localStorage
        }
      }

      // Fallback: localStorage (works for guests too)
      if (typeof window === "undefined") return;
      try {
        const stored = window.localStorage.getItem("anmix-chat-history");
        if (stored) {
          const parsed: ChatSession[] = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setChatHistory(parsed);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    load();
  }, [isLoaded, isSignedIn, user?.id, useSupabaseChat]);

  // Load saved card from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("anmix-billing-card");
      if (stored) {
        const parsed: SavedCard = JSON.parse(stored);
        setSavedCard(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist chat history whenever it changes
  useEffect(() => {
    if (!isLoaded) return;

    // Save to Supabase only when enabled (user_chats table must exist)
    if (useSupabaseChat && isSignedIn && user && supabase) {
      (async () => {
        try {
          await supabase.from("user_chats").upsert(
            {
              user_id: user.id,
              history: chatHistory,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch {
          // ignore write errors; localStorage will still have a copy
        }
      })();
    }

    // Also keep a localStorage copy for fast reloads / guests
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("anmix-chat-history", JSON.stringify(chatHistory));
      } catch {
        // ignore storage errors
      }
    }
  }, [chatHistory, isLoaded, isSignedIn, user?.id, useSupabaseChat]);

  return (
    <div className="min-h-screen text-foreground bg-[#010104] dark:bg-[#010104] font-sans selection:bg-[#0055FF]/30 overflow-hidden relative">

      {/* INTRO ANIMATION OVERLAY */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#010104]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
            onAnimationComplete={(definition) => {
              if ((definition as { opacity?: number })?.opacity === 0) setShowIntro(false);
            }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              onAnimationComplete={() => {
                setTimeout(() => setShowIntro(false), 1800);
              }}
            >
              <div className="flex items-center gap-1">
                {["A","N","M","I","X"," ","A","I"].map((char, i) => (
                  <motion.span
                    key={i}
                    className={cn(
                      "text-5xl md:text-7xl font-bold tracking-wider",
                      char === " " ? "w-4" : "text-white"
                    )}
                    initial={{ filter: "blur(12px)", opacity: 0, y: 20 }}
                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="h-[2px] w-48 md:w-64 bg-gradient-to-r from-transparent via-[#0055FF] to-transparent origin-left"
              />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="text-sm md:text-base text-white/50 tracking-widest uppercase"
              >
                All-in-one AI Platform
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND GRID + LIGHT RAYS (Avento-style) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "70px 70px" }} />
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none hidden dark:block">
        <LightRays
          raysOrigin="top-center"
          raysColor="#0055FF"
          raysSpeed={1}
          lightSpread={2}
          rayLength={3}
          followMouse={false}
          mouseInfluence={0.02}
          noiseAmount={0.015}
          distortion={0.06}
          pulsating={true}
          fadeDistance={1.1}
          saturation={0.5}
        />
      </div>

      {/* Main layout: mobile drawer sidebar + chat */}
      <div className="flex h-screen w-full relative">
      {/* Mobile/tablet overlay (blur background) */}
      <div
        className={cn(
          "fixed inset-0 z-30 lg:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />
              </div>

      {/* LEFT SIDEBAR - full sidebar on large screens, drawer on small screens */}
      <aside
        className={cn(
          // base styles
          "z-40 flex-col bg-[#0a0a0b]/95 backdrop-blur-2xl border-r border-white/[0.06]",
          // layout: drawer on small screens
          "fixed inset-y-0 left-0 w-[82vw] max-w-[320px] lg:static lg:h-auto",
          desktopSidebarCollapsed ? "lg:w-14" : "lg:w-64 xl:w-72",
          // visibility: only when open on mobile, always visible on lg+
          sidebarOpen ? "flex" : "hidden",
          "lg:flex",
          // animation: slide on small, static on lg+
          "transition-transform duration-200 ease-out lg:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border-b border-white/[0.06]",
            desktopSidebarCollapsed ? "p-3 justify-center" : "p-5",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 min-w-0 flex-1 overflow-visible",
              desktopSidebarCollapsed && "justify-center",
            )}
          >
            <div
              className={cn(
                "rounded-xl bg-[#050816] border border-white/10 flex items-center justify-center shadow-[0_0_12px_rgba(0,85,255,0.2)] flex-shrink-0 overflow-visible",
                desktopSidebarCollapsed ? "w-10 h-10 p-1" : "w-9 h-9",
              )}
            >
              <img
                src="/anmix-logo.png"
                alt="ANMIX AI"
                className={cn(
                  "object-contain select-none",
                  desktopSidebarCollapsed ? "w-7 h-7" : "w-7 h-7",
                )}
                draggable={false}
              />
            </div>
            {!desktopSidebarCollapsed && (
              <SparklesText
                text="ANMIX AI"
                sparklesCount={5}
                className="text-sm font-semibold tracking-tight truncate"
              />
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "lg:hidden p-2 rounded-xl hover:bg-white/5 text-white/60",
              desktopSidebarCollapsed && "hidden",
            )}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {desktopSidebarCollapsed ? (
          <div className="flex flex-1 flex-col items-center py-3">
            <div className="mt-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={clearChat}
                className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors flex items-center justify-center"
                aria-label="New Chat"
                title="New Chat"
              >
                <Plus size={18} className="text-white/80" />
              </button>

              <button
                type="button"
                onClick={openChatHistory}
                className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors flex items-center justify-center"
                aria-label="Chat history"
                title="Chat history"
              >
                <FileText size={18} className="text-white/70" />
              </button>

              <button
                type="button"
                onClick={openImageGenChat}
                className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors flex items-center justify-center"
                aria-label="Image generation"
                title="Image generation"
              >
                <ImageIcon size={18} className="text-white/70" />
              </button>
            </div>

            <div className="flex-1" />

            <div className="pb-3">
              {user ? (
                <Dropdown>
                  <DropdownTrigger className="cursor-pointer">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || "Profile"}
                        className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
                        title={user.fullName || "Profile"}
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#ec4899] flex items-center justify-center text-xs font-bold text-white border border-white/20"
                        title="Profile"
                      >
                        {(user?.firstName?.[0] || "A").toUpperCase()}
                      </div>
                    )}
                  </DropdownTrigger>
                  <DropdownContent
                    align="start"
                    side="right"
                    placement="top"
                    sideOffset={10}
                    className="w-60 bg-[#020617] border-white/10 text-white"
                  >
                <div className="px-2 py-2 border-b border-white/10 mb-1">
                  <p className="text-[10px] text-white/50">Signed in as</p>
                  <p className="text-xs font-semibold truncate">
                    {user?.emailAddresses?.[0]?.emailAddress ?? "user"}
                  </p>
                </div>
                <DropdownItem
                  className="gap-2 cursor-pointer"
                  onClick={() => setProfileOpen(true)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownItem>
                <DropdownItem
                  className="gap-2 cursor-pointer"
                  onClick={() => setBillingOpen(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  Billing
                </DropdownItem>
                <DropdownItem
                  className="gap-2 text-white/60 hover:bg-white/5 hover:text-white cursor-pointer"
                  onClick={() => setUsageOpen(true)}
                >
                  <BarChart3 className="h-4 w-4" />
                  Usage
                </DropdownItem>
                <DropdownItem
                  className="gap-2 text-white/60 hover:bg-white/5 hover:text-white cursor-pointer"
                  onClick={() => setApiOpen(true)}
                >
                  <Code2 className="h-4 w-4" />
                  API
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  className="gap-2"
                  destructive
                  onClick={() => signOut(() => router.push("/"))}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownItem>
              </DropdownContent>
                </Dropdown>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setClerkAuthMode("signup"); setShowClerkAuthModal(true); }}
                    className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-white/80"
                    title="Sign up"
                  >
                    A
                  </button>
                )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4">
              <EyeCatchingButton_v1 
                onClick={clearChat}
                className="w-full bg-[#0055FF] hover:bg-[#0044cc] transition-all p-3.5 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,85,255,0.2)]"
              >
                <Plus size={20} />
                <span>New Chat</span>
              </EyeCatchingButton_v1>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between px-3 mb-3">
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Chat History</p>
                <Sparkles size={12} className="text-[#0055FF]" />
              </div>
              {chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <button 
                    key={chat.id} 
                    onClick={() => loadChat(chat)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="w-2 h-2 rounded-full bg-white/30 group-hover:bg-[#0055FF] transition-colors shrink-0" />
                    <span className="truncate text-xs text-white/70 group-hover:text-white font-medium">{chat.title}</span>
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-white/40 italic px-3">No past chats yet</p>
              )}
            </div>

            <div className="p-4 space-y-3 border-t border-white/[0.06]">
              <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-[#1d4ed8]/60 via-[#38bdf8]/40 to-[#1d4ed8]/60 overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.6),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.4),transparent_55%)] pointer-events-none" />
                <div className="relative p-3 rounded-xl bg-[#020617] border border-[#0055FF]/40 overflow-hidden flex flex-col gap-2 animate-bg-shine bg-[length:220%_100%]">
                  <p className="text-xs font-bold text-white">Upgrade to Pro</p>
                  <p className="text-[10px] text-white/60 leading-relaxed">
                    Premium models of Anmix Ai.
                  </p>
                  <div className="mt-2">
                    <AnimatedShinyButton url="/#membership" className="text-xs px-3 py-1.5">
                      Upgrade Pro
                    </AnimatedShinyButton>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {user ? (
                <Dropdown>
                  <DropdownTrigger className="cursor-pointer flex items-center gap-3 w-full">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || "Profile"}
                        className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#ec4899] flex items-center justify-center text-xs font-bold text-white border border-white/20">
                        {(user?.firstName?.[0] || "A").toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {user?.fullName || "Your account"}
                      </span>
                      <span className="text-[10px] text-white/50 truncate">
                        {user?.emailAddresses?.[0]?.emailAddress ?? ""}
                      </span>
                    </div>
                  </DropdownTrigger>
                  <DropdownContent
                    align="start"
                    side="left"
                    placement="top"
                    sideOffset={3}
                    className="w-60 bg-[#020617] border-white/10 text-white"
                  >
                    <div className="px-2 py-2 border-b border-white/10 mb-1">
                      <p className="text-[10px] text-white/50">Signed in as</p>
                      <p className="text-xs font-semibold truncate">
                        {user?.emailAddresses?.[0]?.emailAddress ?? "user"}
                      </p>
                    </div>
                    <DropdownItem
                      className="gap-2 cursor-pointer"
                      onClick={() => setProfileOpen(true)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownItem>
                    <DropdownItem
                      className="gap-2 cursor-pointer"
                      onClick={() => setBillingOpen(true)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </DropdownItem>
                    <DropdownItem
                      className="gap-2 text-white/60 hover:bg-white/5 hover:text-white cursor-pointer"
                      onClick={() => setUsageOpen(true)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Usage
                    </DropdownItem>
                    <DropdownItem
                      className="gap-2 text-white/60 hover:bg-white/5 hover:text-white cursor-pointer"
                      onClick={() => setApiOpen(true)}
                    >
                      <Code2 className="h-4 w-4" />
                      API
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      className="gap-2"
                      destructive
                      onClick={() => signOut(() => router.push("/"))}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
                ) : (
                  <div
                    className="w-full cursor-pointer"
                    onClick={() => { setClerkAuthMode("signup"); setShowClerkAuthModal(true); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setClerkAuthMode("signup"); setShowClerkAuthModal(true); } }}
                  >
                    <PearlSignUpButton />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Sidebar toggle - outside sidebar (desktop only) */}
      <div className="hidden lg:flex shrink-0 w-6 items-start justify-start pt-4">
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {desktopSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden min-w-0">
        <header className="relative h-14 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-white/60 shrink-0"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center max-w-[70vw]">
            <AnimatedBadge
              text="Introducing Anmix Ai"
              color="#22d3ee"
              className="px-3 py-1 text-[11px] gap-2 bg-transparent dark:bg-transparent border-white/10 dark:border-white/10 text-white/80 dark:text-white/80 shadow-none"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
            {user && !voiceMode && (
              <div className="w-7 h-7 flex items-center justify-center">
                <VoiceButton size={22} onClick={startVoiceChatSession} />
              </div>
            )}
            {!user && (
              <ShimmerButton
                shimmerColor="#ffffff"
                background="rgba(5,10,25,1)"
                className="px-5 py-2 text-[12px]"
                onClick={() => { setClerkAuthMode("signup"); setShowClerkAuthModal(true); }}
              >
                Sign up
              </ShimmerButton>
            )}
          </div>
        </header>

          <div ref={scrollRef} className={`flex-1 ${messages.length === 0 ? "overflow-y-auto scrollbar-hide" : "overflow-y-auto scrollbar-hide scroll-smooth"}`}>
            <div className={`max-w-4xl mx-auto px-4 py-2 space-y-1.5 ${messages.length === 0 ? "h-full flex flex-col justify-center" : ""}`}>
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div 
                  key="welcome-screen"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                  className="flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="relative group overflow-visible">
                    <div className="absolute -inset-6 sm:-inset-10 bg-[#0055FF]/10 rounded-full blur-3xl group-hover:bg-[#0055FF]/15 transition-all duration-700" />
                    {!voiceMode ? (
                    <img 
                      src="/anmix-logo.png" 
                      alt="ANMIX" 
                      className="w-24 h-24 md:w-28 md:h-28 relative z-10 drop-shadow-[0_0_30px_rgba(0,85,255,0.35)] transition-transform duration-500 group-hover:scale-105 object-contain"
                        draggable={false}
                    />
                    ) : (
                      <div className="relative z-10 overflow-visible">
                        <AILoader size={180} text="ANMIX AI" responsive />
                  </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <AnimatedText
                      text={`${greeting} ${displayGreetingName}`}
                      textClassName="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight"
                    />
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-white/50 font-medium tracking-[0.15em] uppercase whitespace-nowrap overflow-x-auto max-w-[95vw] scrollbar-hide">
                      All in one open source ai - ANMIX{"\u00A0"}AI
                    </p>
                  </div>
                  {voiceMode && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 justify-center text-xs">
                      <GradientButton
                        onClick={() => setVoiceAgentActive((prev) => !prev)}
                        variant="emerald"
                        label={voiceAgentActive ? "Stop" : "Talk to Anmix Ai"}
                        className="text-xs"
                      />
                      <GradientButton
                        onClick={() => {
                          setVoiceAgentActive(false);
                          setVoiceMode(false);
                        }}
                        variant="purple"
                        label="Close"
                        className="text-xs"
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="message-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {voiceMode && (
                    <div className="mb-3 flex flex-wrap items-center gap-3 justify-center text-xs">
                      <GradientButton
                        onClick={() => setVoiceAgentActive((prev) => !prev)}
                        variant="emerald"
                        label={voiceAgentActive ? "Stop" : "Talk to Anmix Ai"}
                        className="text-xs"
                      />
                      <GradientButton
                        onClick={() => {
                          setVoiceAgentActive(false);
                          setVoiceMode(false);
                        }}
                        variant="purple"
                        label="Close"
                        className="text-xs"
                      />
                    </div>
                  )}
                  {messages.map((msg) => {
                    const alignRight = msg.role === "user";
                    return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={msg.id} 
                      className={`flex gap-2 ${alignRight ? "flex-row justify-end" : "flex-row"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${
                        alignRight ? "order-2" : "order-first"
                        } ${
                        msg.role === "assistant" 
                            ? "bg-[#050816] border-white/10 shadow-[0_0_10px_rgba(59,130,246,0.35)]"
                        : "bg-white/5 dark:bg-white/5 bg-black/5 border-white/10 dark:border-white/10 border-black/10 text-slate-400 backdrop-blur-xl"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <img
                            src="/anmix-logo.png"
                            alt="ANMIX"
                            className="w-6 h-6 object-contain"
                            draggable={false}
                          />
                        ) : user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.fullName || "You"}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <User size={10} />
                        )}
                      </div>
                      
                      <div className={`space-y-1 min-w-0 ${alignRight ? "order-1 flex flex-col items-end shrink-0 max-w-[90vw] sm:max-w-[85%] md:max-w-[75%]" : "flex-1 text-left max-w-[90vw] sm:max-w-[85%] md:max-w-[80%]"}`}>
                        {msg.content && (
                          msg.role === "user" ? (
                            (() => {
                              const content = msg.content || "";
                              return (
                                <div className="space-y-1.5 flex flex-col items-end w-fit max-w-full">
                                  <div
                                    className="text-left text-[11px] sm:text-[13px] leading-relaxed selection:bg-blue-500/50 dark:text-slate-100 text-slate-900 bg-blue-600/20 border border-blue-500/30 px-3 py-2 sm:px-3.5 sm:py-2 rounded-lg rounded-tr-none shadow-md backdrop-blur-md break-words whitespace-pre-wrap w-fit max-w-full"
                                  >
                                    {content}
                                  </div>
                                  <div className="flex justify-end text-[9px] text-white/40">
                                    <CopyButton
                                      text={content}
                                      className="h-6 w-6 rounded-full border-0 bg-transparent hover:bg-white/5 text-white/60"
                                      size="icon"
                                    />
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="space-y-1.5 max-w-full">
                              {msg.reasoning && (
                                <div className="mb-1.5">
                                  <ReasoningBlock reasoning={msg.reasoning} />
                                </div>
                              )}
                              <div className="text-[11px] sm:text-[13px] leading-relaxed w-fit max-w-[90vw] sm:max-w-[85%] md:max-w-[75%] break-words selection:bg-blue-500/50 dark:text-slate-200 text-slate-200">
                                <FormattedMessage content={msg.content} role={msg.role} />
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-white/40">
                                <button
                                  type="button"
                                  onClick={() => handleRegenerate(messages.findIndex((m) => m.id === msg.id))}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-white/5"
                                >
                                  <RefreshCcw className="h-3 w-3" />
                                  <span>Regenerate</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMessageReactions((prev) => ({ ...prev, [msg.id]: "up" }))
                                  }
                                  className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-white/5",
                                    messageReactions[msg.id] === "up" && "text-white",
                                  )}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                {messageReactions[msg.id] !== "up" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMessageReactions((prev) => ({ ...prev, [msg.id]: "down" }))
                                    }
                                    className={cn(
                                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-white/5",
                                      messageReactions[msg.id] === "down" && "text-white",
                                    )}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </button>
                                )}
                                <CopyButton
                                  text={msg.content}
                                  className="h-6 w-6 rounded-full border-0 bg-transparent hover:bg-white/5 text-white/60"
                                  size="icon"
                                />
                              </div>
                            </div>
                          )
                        )}

                        {msg.previews && (
                          <div className={`grid grid-cols-1 gap-2 mt-2 ${alignRight ? "w-fit justify-items-end" : "w-full sm:grid-cols-2"}`}>
                            {msg.previews.map((file, fIdx) => {
                              const isGenerated = file.desc === "generated" || file.desc === "enhanced";
                              const isUploadedImage = file.type === "image" && file.desc === "Uploaded via FileUpload";
                              return (
                                <div 
                                  key={fIdx} 
                                  className={
                                    isGenerated
                                      ? "rounded-xl overflow-hidden max-w-xs"
                                      : isUploadedImage
                                        ? "rounded-xl overflow-hidden max-w-xs"
                                        : "dark:bg-white/5 bg-slate-50/95 rounded-xl p-2.5 flex flex-col gap-2.5 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group backdrop-blur-xl shadow-md max-w-xs"
                                  }
                                >
                                {file.type === "image" && (file.url || file.status === "generating") ? (
                                  isGenerated ? (
                                    <ImageGeneration
                                      imageUrl={file.url || null}
                                      runReveal={!!file.url && file.status === "done" && !revealedImageIds.has(msg.id)}
                                      onRevealComplete={() => setRevealedImageIds((prev) => new Set(prev).add(msg.id))}
                                    >
                                      {file.url ? (
                                        <div
                                          className="relative w-full h-48 select-none"
                                          onContextMenu={(e) => e.preventDefault()}
                                          onDragStart={(e) => e.preventDefault()}
                                          onMouseDown={(e) => {
                                            if (e.button === 2) e.preventDefault();
                                          }}
                                          style={{
                                            WebkitTouchCallout: "none",
                                            WebkitUserSelect: "none",
                                            userSelect: "none",
                                          }}
                                        >
                                          <img src={file.url} alt={file.name} className="w-full h-48 object-cover" />
                                          {file.status === "done" && (
                                            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setImageViewerUrl(file.url!);
                                                    setImageViewerPrompt(file.prompt || "");
                                                    setImageViewerOpen(true);
                                                  }}
                                                className="h-8 w-8 rounded-full bg-black/55 border border-white/15 backdrop-blur hover:bg-black/75 flex items-center justify-center text-white/90"
                                                  aria-label="View image"
                                                >
                                                  <Eye size={16} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => downloadGeneratedImage(file.url!, file.prompt || "")}
                                                  className="h-8 w-8 rounded-full bg-black/55 border border-white/15 backdrop-blur hover:bg-black/75 flex items-center justify-center text-white/90"
                                                  aria-label="Download image"
                                                >
                                                  <Download size={16} />
                                                </button>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-fuchsia-500/25 via-blue-500/20 to-emerald-500/20 animate-pulse" />
                                      )}
                                    </ImageGeneration>
                                  ) : isUploadedImage ? (
                                    <div className="w-full h-40">
                                      {file.url && (
                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-full rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-1">
                                      <div className="w-full h-32">
                                        {file.url && (
                                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                        )}
                                      </div>
                                    </div>
                                  )
                                ) : file.type === "video" && (file.url || file.status === "generating") ? (
                                  (() => {
                                    const runVideoReveal = !!file.url && file.status === "done" && !revealedVideoIds.has(msg.id);
                                    return (
                                      <div className="rounded-xl overflow-hidden max-w-xs">
                                        {!file.url ? (
                                          <div className="flex flex-col gap-2">
                                            <span className="text-sm text-white/70 anmix-shimmer-text">Creating video. This may take a minute.</span>
                                            <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-fuchsia-500/25 via-blue-500/20 to-emerald-500/20 animate-pulse" />
                                          </div>
                                        ) : (
                                          <div className="relative w-full aspect-video select-none">
                                            <video
                                              src={file.url}
                                              controls
                                              controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                                              disablePictureInPicture
                                              disableRemotePlayback
                                              playsInline
                                              className="w-full h-full object-cover rounded-xl [&::-webkit-media-controls-enclosure]:overflow-hidden"
                                              onContextMenu={(e) => e.preventDefault()}
                                              onDragStart={(e) => e.preventDefault()}
                                              style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", touchAction: "none" }}
                                            />
                                            {runVideoReveal && (
                                              <motion.div
                                                className="absolute inset-0 pointer-events-none backdrop-blur-2xl bg-white/5 rounded-xl"
                                                initial={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                                                animate={{ clipPath: "polygon(0 0, 100% 0, 100% 0%, 0 0%)" }}
                                                transition={{ duration: 2.5, ease: [0.22, 0.61, 0.36, 1] }}
                                                onAnimationComplete={() => setRevealedVideoIds((prev) => new Set(prev).add(msg.id))}
                                              />
                                            )}
                                            {!runVideoReveal && file.status === "done" && (
                                              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                                                  <button
                                                    type="button"
                                                    onClick={() => { setVideoViewerUrl(file.url!); setVideoViewerOpen(true); }}
                                                    className="h-8 w-8 rounded-full bg-black/55 border border-white/15 backdrop-blur hover:bg-black/75 flex items-center justify-center text-white/90"
                                                    aria-label="View video"
                                                  >
                                                    <Eye size={16} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => downloadGeneratedVideo(file.url!, file.prompt || "")}
                                                    className="h-8 w-8 rounded-full bg-black/55 border border-white/15 backdrop-blur hover:bg-black/75 flex items-center justify-center text-white/90"
                                                    aria-label="Download video"
                                                  >
                                                    <Download size={16} />
                                                  </button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                      file.type === "image" ? "bg-blue-500/20 text-blue-400" :
                                      file.type === "text" ? "bg-emerald-500/20 text-emerald-400" :
                                      file.type === "video" ? "bg-purple-500/20 text-purple-400" :
                                      "bg-amber-500/20 text-amber-400"
                                    }`}>
                                      {file.type === "image" && <ImageIcon size={18} />}
                                      {file.type === "text" && <FileText size={18} />}
                                      {file.type === "video" && <Video size={18} />}
                                      {file.type === "pdf" && <File size={18} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-black truncate dark:text-slate-200 text-slate-800 uppercase tracking-tighter">{file.name}</p>
                                      <p className="text-[8px] text-slate-500 font-bold">{file.size}</p>
                                    </div>
                                    <ArrowUpRight size={12} className="text-slate-600 group-hover:text-blue-400 transition-all" />
                                  </div>
                                )}
                                {file.type === "image" && file.url && !isGenerated && !isUploadedImage && (
                                  <div className="flex items-center justify-between px-1">
                                    <p className="text-[9px] font-bold text-slate-300 truncate tracking-tighter uppercase">{file.name}</p>
                                    <ArrowUpRight size={10} className="text-slate-500" />
                                  </div>
                                )}
                              </div>
                            )})}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );})}

                  {(chatMode === "image-edit" || chatMode === "image-enhance" || chatMode === "video-gen") && pendingImagePreviews.length > 0 && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 flex-row justify-end"
                    >
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border order-first bg-white/5 border-white/10 text-slate-400 backdrop-blur-xl">
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="You" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <User size={10} />
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0 space-y-1">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">
                          {chatMode === "video-gen" ? "Reference image — add prompt &amp; send" : "Preview — add your prompt &amp; send"}
                        </p>
                        <div className="grid grid-cols-1 gap-2 w-fit justify-items-end">
                          {pendingImagePreviews.map((file, fIdx) => (
                            <div key={fIdx} className="dark:bg-white/5 bg-slate-50/95 rounded-xl p-2.5 flex flex-col gap-2 border border-white/10 border-blue-500/30 shadow-md max-w-[280px]">
                              {file.url && (
                                <div className="w-full rounded-lg overflow-hidden bg-white/5">
                                  <img src={file.url} alt={file.name} className="w-full h-40 object-cover" />
                                </div>
                              )}
                              <p className="text-[9px] font-bold text-slate-300 truncate">{file.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isTyping && selectedModel !== "Anmix-V0.5 CODING THINKING" && (
                    <motion.div 
                      key="typing-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 items-center"
                    >
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                        <Spinner variant="pinwheel" className="w-4 h-4 text-[#60a5ff]" />
                        <span className="anmix-shimmer-text">ANMIX AI is thinking…</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />

          </div>
        </div>

        {!(voiceMode && voiceAgentActive) && (
        <div className="pb-6 sm:pb-8 lg:pb-10 px-4 sm:px-6 lg:px-10">
          <div className="max-w-4xl mx-auto relative group">
            <ChatInput 
              value={input}
              onChange={setInput}
              onSend={handleSendMessage}
              isGenerating={isTyping}
              selectedModel={selectedModel}
              onModelChange={(model) => {
                setSelectedModel(model);
                if (IMAGE_MODELS_FOR_CHAT.includes(model)) {
                  setChatMode("image-gen");
                } else if (VIDEO_MODELS_FOR_CHAT.includes(model)) {
                  setChatMode("video-gen");
                } else if (GROQ_MODELS.includes(model)) {
                  setChatMode("chat");
                }
              }}
              hasMessages={messages.length > 0}
                 hideMarquee={voiceMode}
                hidePlaceholder={false}
                placeholderText={
                  chatMode === "image-edit"
                    ? "Describe your edit (Flux only)"
                    : chatMode === "image-gen"
                      ? "Describe an image to generate"
                      : chatMode === "video-gen"
                        ? "Describe a video to generate"
                        : chatMode === "image-enhance"
                          ? "Describe how to enhance your image"
                        : voiceMode
                          ? "Talk to Anmix Ai"
                          : "Ask anything to anmix ai"
                }
                onVoiceCall={startVoiceChatSession}
                 onImageMode={startImageChat}
                 mode={chatMode}
                 onPendingFilesChange={
                  chatMode === "image-edit" || chatMode === "image-enhance" || chatMode === "video-gen"
                    ? (files) =>
                        setPendingImagePreviews(
                          files.map((f: any) => ({ url: f.url, name: f.name })),
                        )
                    : undefined
                }
                 onImageMarquee={() => {
                  // Open a fresh image generation chat
                  startImageChat();
                 }}
                 onEnhanceMarquee={() => {
                  setImageEnhancerComingSoonOpen(true);
                 }}
                 onTextVoiceMarquee={() => {
                  setVoiceTextComingSoonOpen(true);
                 }}
                isVoiceMode={voiceMode}
              apiKey={process.env.NEXT_PUBLIC_VOICE_API_KEY || process.env.NEXT_PUBLIC_SAMBANOVA_API_KEY || ""}
            />
            
            <p className="text-[10px] text-center text-white/40 mt-6 uppercase tracking-[0.2em] font-medium">
                ANMIX AI can make mistakes. Please double check the answers.
            </p>
          </div>
        </div>
        )}
      </main>
      <CookiePanel />
      <ResponsiveModal open={usageOpen} onOpenChange={setUsageOpen}>
        <ResponsiveModalContent side="bottom" className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Coming Soon !</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Usage analytics and limits dashboard will be available here soon.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
        </ResponsiveModalContent>
      </ResponsiveModal>
      <ResponsiveModal open={apiOpen} onOpenChange={setApiOpen}>
        <ResponsiveModalContent side="bottom" className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Coming Soon !</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              API keys and developer settings will be available here soon.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
        </ResponsiveModalContent>
      </ResponsiveModal>
      <ResponsiveModal open={imageEditorComingSoonOpen} onOpenChange={setImageEditorComingSoonOpen}>
        <ResponsiveModalContent side="bottom" className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Coming Soon !</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Image editor will be available soon.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
        </ResponsiveModalContent>
      </ResponsiveModal>
      <ResponsiveModal open={imageEnhancerComingSoonOpen} onOpenChange={setImageEnhancerComingSoonOpen}>
        <ResponsiveModalContent side="bottom" className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Coming Soon !</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Image enhancer will be available soon.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
        </ResponsiveModalContent>
      </ResponsiveModal>
      <ResponsiveModal open={voiceTextComingSoonOpen} onOpenChange={setVoiceTextComingSoonOpen}>
        <ResponsiveModalContent side="bottom" className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Coming Soon !</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Make text to voice will be available here soon.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
        </ResponsiveModalContent>
      </ResponsiveModal>
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-5xl bg-black/80 border border-white/10 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-sm">Generated image</DialogTitle>
            {imageViewerPrompt ? (
              <DialogDescription className="text-white/60 text-xs">
                {imageViewerPrompt}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          {imageViewerUrl ? (
            <div
              ref={imageViewerRef}
              className="relative w-full overflow-hidden rounded-xl select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              <img
                src={imageViewerUrl}
                alt="Generated"
                className="w-full h-auto object-contain pointer-events-none"
                draggable={false}
              />
              {/* Overlay blocks right-click/long-press save - captures all pointer events */}
              <div
                className="absolute inset-0 cursor-default"
                aria-hidden
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ touchAction: "none" }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={videoViewerOpen} onOpenChange={setVideoViewerOpen}>
        <DialogContent className="max-w-4xl bg-black/80 border border-white/10 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-sm">Generated video</DialogTitle>
          </DialogHeader>
          {videoViewerUrl ? (
            <div
              ref={videoViewerRef}
              className="relative w-full overflow-hidden rounded-xl select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              <video
                src={videoViewerUrl}
                controls
                controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                disablePictureInPicture
                disableRemotePlayback
                playsInline
                className="w-full rounded-xl [&::-webkit-media-controls-enclosure]:overflow-hidden"
              />
              <div
                className="absolute inset-0 cursor-default"
                aria-hidden
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ touchAction: "none", pointerEvents: "none" }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 bg-transparent border-0 shadow-none overflow-visible">
          <CardCanvas className="rounded-2xl">
            <Card className="w-full rounded-2xl bg-[#020617]/95 border border-white/10 backdrop-blur-xl p-6">
              <DialogHeader>
                <DialogTitle className="text-white text-sm">Sign up to continue</DialogTitle>
                <DialogDescription className="text-white/60 text-xs mt-1">
                  Create a free account to start using chat and voice with Anmix AI.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-between items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setAuthPromptOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-4 py-2 text-[12px] font-medium text-white/80 hover:bg-white/5 transition-colors"
                >
                  Maybe
                </button>
                <ShimmerButton
                  shimmerColor="#ffffff"
                  background="rgba(5,10,25,1)"
                  className="px-5 py-2 text-[12px]"
                  onClick={() => {
                    setAuthPromptOpen(false);
                    setClerkAuthMode("signup");
                    setShowClerkAuthModal(true);
                  }}
                >
                  Sign up
                </ShimmerButton>
              </div>
            </Card>
          </CardCanvas>
        </DialogContent>
      </Dialog>
      <Dialog open={showClerkAuthModal} onOpenChange={setShowClerkAuthModal}>
        <DialogContent className="max-w-[420px] bg-[#0f172a] border border-white/10 p-0 overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => setClerkAuthMode("signin")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                clerkAuthMode === "signin" ? "text-white border-b-2 border-[#0055FF]" : "text-white/50 hover:text-white/80"
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setClerkAuthMode("signup")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                clerkAuthMode === "signup" ? "text-white border-b-2 border-[#0055FF]" : "text-white/50 hover:text-white/80"
              )}
            >
              Sign up
            </button>
          </div>
          <div className="min-h-[360px] flex justify-center items-start p-4 overflow-auto">
            {clerkAuthMode === "signup" ? (
              <SignUp routing="hash" afterSignUpUrl="/" signInUrl="#" />
            ) : (
              <SignIn routing="hash" afterSignInUrl="/" signUpUrl="#" />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[430px] bg-[#020617] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Profile details</DialogTitle>
            <DialogDescription>
              View your account information as stored in Anmix AI.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="profile-name" className="text-right text-xs text-white/70">
                Name
              </Label>
              <Input
                id="profile-name"
                className="col-span-3 h-9 text-xs bg-white/5 border-white/15 text-white"
                defaultValue={user?.fullName || ""}
                readOnly
              />
    </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="profile-username" className="text-right text-xs text-white/70">
                Username
              </Label>
              <Input
                id="profile-username"
                className="col-span-3 h-9 text-xs bg-white/5 border-white/15 text-white"
                defaultValue={
                  user?.username ||
                  user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
                  ""
                }
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="profile-email" className="text-right text-xs text-white/70">
                Email
              </Label>
              <Input
                id="profile-email"
                className="col-span-3 h-9 text-xs bg-white/5 border-white/15 text-white"
                defaultValue={user?.emailAddresses?.[0]?.emailAddress || ""}
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent className="sm:max-w-[430px] bg-[#020617] border border-white/10">
          <div className="flex flex-col gap-2">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5"
              aria-hidden="true"
            >
              <CreditCard className="opacity-80 text-white" size={16} strokeWidth={2} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-left text-white">Billing & card details</DialogTitle>
              <DialogDescription className="text-left">
                Manage the card used for your ANMIX AI subscription. This is demo UI only.
              </DialogDescription>
            </DialogHeader>
          </div>

          {savedCard && (
            <div className="mt-3 mb-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-white/80 mb-1">Saved card</p>
              <div className="flex items-center justify-between text-[11px] text-white/70">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {savedCard.brand} •••• {savedCard.last4}
                  </span>
                  <span className="text-white/50 text-[10px]">
                    Expires {savedCard.expiry} · {savedCard.name}
                  </span>
                </div>
                {savedCard.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-semibold">
                    Default
                  </span>
                )}
              </div>
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              let hasError = false;

              const nameTrimmed = cardName.trim();
              if (!nameTrimmed) {
                setCardNameError("Name is required.");
                hasError = true;
              } else {
                setCardNameError("");
              }

              const numberDigits = cardNumber.replace(/\s+/g, "");
              if (!/^\d{16}$/.test(numberDigits)) {
                setCardNumberError("Enter a valid card number (16 digits).");
                hasError = true;
              } else {
                setCardNumberError("");
              }

              const expiryTrimmed = cardExpiry.trim();
              const expiryMatch = /^(\d{2})\/(\d{2})$/.test(expiryTrimmed)
                ? expiryTrimmed.match(/^(\d{2})\/(\d{2})$/)
                : null;
              if (!expiryMatch) {
                setCardExpiryError("Use MM/YY format.");
                hasError = true;
              } else {
                const month = Number(expiryMatch[1]);
                if (month < 1 || month > 12) {
                  setCardExpiryError("Month must be between 01 and 12.");
                  hasError = true;
                } else {
                  setCardExpiryError("");
                }
              }

              const cvcTrimmed = cardCvc.trim();
              if (!/^\d{3,4}$/.test(cvcTrimmed)) {
                setCardCvcError("CVC must be 3–4 digits.");
                hasError = true;
              } else {
                setCardCvcError("");
              }

              if (hasError) return;

              const last4 = numberDigits.slice(-4);
              const brand =
                numberDigits.startsWith("4") ? "Visa" :
                numberDigits.startsWith("5") ? "Mastercard" :
                "Card";

              const card: SavedCard = {
                name: nameTrimmed || (user?.fullName ?? "Card holder"),
                last4,
                brand,
                expiry: expiryTrimmed,
                isDefault: cardDefault,
              };

              try {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("anmix-billing-card", JSON.stringify(card));
                }
              } catch {
                // ignore storage errors
              }

              setSavedCard(card);
              setBillingOpen(false);
            }}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="billing-name">Name on card</Label>
                <Input
                  id="billing-name"
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => {
                    // Only letters and spaces
                    const next = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setCardName(next);
                  }}
                />
                {cardNameError && (
                  <p className="text-[10px] text-red-400 mt-0.5">{cardNameError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-number">Card number</Label>
                <Input
                  id="billing-number"
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => {
                    // Only digits, max 16, auto-space every 4
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                    setCardNumber(formatted);
                  }}
                />
                {cardNumberError && (
                  <p className="text-[10px] text-red-400 mt-0.5">{cardNumberError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="billing-expiry">Expiry date</Label>
                  <Input
                    id="billing-expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      // Only digits, format as MM/YY
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      let formatted = digits;
                      if (digits.length >= 3) {
                        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                      }
                      setCardExpiry(formatted);
                    }}
                  />
                  {cardExpiryError && (
                    <p className="text-[10px] text-red-400 mt-0.5">{cardExpiryError}</p>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="billing-cvc">CVC</Label>
                  <Input
                    id="billing-cvc"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => {
                      // Only digits, max length 4
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardCvc(digits);
                    }}
                  />
                  {cardCvcError && (
                    <p className="text-[10px] text-red-400 mt-0.5">{cardCvcError}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="billing-default"
                checked={cardDefault}
                onCheckedChange={(v) => setCardDefault(!!v)}
              />
              <Label htmlFor="billing-default" className="font-normal text-muted-foreground text-xs">
                Set as default payment method
              </Label>
            </div>
            <button
              type="submit"
              className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-[#0055FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0044cc] transition-colors"
            >
              Save card
            </button>
          </form>
        </DialogContent>
      </Dialog>
      </div>
      <VoiceAgentClient
        active={voiceAgentActive}
        onConversationText={handleVoiceConversationText}
      />
    </div>
  );
}
