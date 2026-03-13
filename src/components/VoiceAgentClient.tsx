"use client";

import React, { useEffect, useMemo, useRef } from "react";
import "@deepgram/browser-agent";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "deepgram-agent": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        config?: string;
        url?: string;
        width?: string | number;
        height?: string | number;
        "auth-scheme"?: string;
        "idle-timeout-ms"?: string | number;
        "output-sample-rate"?: string | number;
      };
    }
  }
}

type DeepgramAgentElement = HTMLElement & {
  token?: string;
};

interface VoiceAgentClientProps {
  active: boolean;
  onConversationText?: (payload: { role: string; content: string }) => void;
}

const VoiceAgentClient: React.FC<VoiceAgentClientProps> = ({ active, onConversationText }) => {
  const agentRef = useRef<DeepgramAgentElement | null>(null);

  const settingsConfig = useMemo(
    () =>
      JSON.stringify({
        type: "Settings",
        audio: {
          input: {
            encoding: "linear16",
            sample_rate: 48000,
          },
          output: {
            encoding: "linear16",
            sample_rate: 24000,
            container: "none",
          },
        },
        agent: {
          language: "en",
          speak: {
            provider: {
              type: "eleven_labs",
              model_id: "eleven_multilingual_v2",
              voice_id: "cgSgspJ2msm6clMCkdW9",
            },
          },
          listen: {
            provider: {
              type: "deepgram",
              version: "v2",
              model: "flux-general-en",
            },
          },
          think: {
            provider: {
              type: "open_ai",
              model: "gpt-5.2",
            },
            prompt: `#Role
You are a general-purpose virtual assistant speaking to users over the phone. Your task is to help them find accurate, helpful information across a wide range of everyday topics.

#General Guidelines
-Be warm, friendly, and professional.
-Speak clearly and naturally in plain language.
-Keep most responses to 1–2 sentences and under 120 characters unless the caller asks for more detail (max: 300 characters).
-Do not use markdown formatting, like code blocks, quotes, bold, links, or italics.
-Use line breaks in lists.
-Use varied phrasing; avoid repetition.
-If unclear, ask for clarification.
-If the user’s message is empty, respond with an empty message.
-If asked about your well-being, respond briefly and kindly.

#Voice-Specific Instructions
-Speak in a conversational tone—your responses will be spoken aloud.
-Pause after questions to allow for replies.
-Confirm what the customer said if uncertain.
-Never interrupt.

#Style
-Use active listening cues.
-Be warm and understanding, but concise.
-Use simple words unless the caller uses technical terms.

#Call Flow Objective
-Greet the caller and introduce yourself:
“Hi there, I’m your virtual assistant—how can I help today?”
-Your primary goal is to help users quickly find the information they’re looking for. This may include:
Quick facts: “The capital of Japan is Tokyo.”
Weather: “It’s currently 68 degrees and cloudy in Seattle.”
Local info: “There’s a pharmacy nearby open until 9 PM.”
Basic how-to guidance: “To restart your phone, hold the power button for 5 seconds.”
FAQs: “Most returns are accepted within 30 days with a receipt.”
Navigation help: “Can you tell me the address or place you’re trying to reach?”
-If the request is unclear:
“Just to confirm, did you mean…?” or “Can you tell me a bit more?”
-If the request is out of scope (e.g. legal, financial, or medical advice):
“I’m not able to provide advice on that, but I can help you find someone who can.”

#Off-Scope Questions
-If asked about sensitive topics like health, legal, or financial matters:
“I’m not qualified to answer that, but I recommend reaching out to a licensed professional.”

#User Considerations
-Callers may be in a rush, distracted, or unsure how to phrase their question. Stay calm, helpful, and clear—especially when the user seems stressed, confused, or overwhelmed.

#Closing
-Always ask:
“Is there anything else I can help you with today?”
-Then thank them warmly and say:
“Thanks for calling. Take care and have a great day!”`,
          },
          greeting: "Hello! i am anmix ai, How may I help you?",
        },
      }),
    []
  );

  useEffect(() => {
    if (!agentRef.current) return;
    const key = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "";
    if (key) {
      agentRef.current.token = key;
    }
  }, []);

  // Listen for structured messages from the agent and surface ConversationText events
  useEffect(() => {
    const el = agentRef.current;
    if (!el || !onConversationText) return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<any>;
      const data = custom.detail;
      if (data && data.type === "ConversationText" && typeof data.content === "string") {
        const role = data.role === "assistant" ? "assistant" : "user";
        onConversationText({ role, content: data.content });
      }
    };

    el.addEventListener("structured message", handler as any);
    return () => {
      el.removeEventListener("structured message", handler as any);
    };
  }, [onConversationText]);

  const DeepgramAgentTag: any = "deepgram-agent";

  return (
    <DeepgramAgentTag
      ref={agentRef as any}
      url="wss://agent.deepgram.com/v1/agent/converse"
      auth-scheme="token"
      width={0}
      height={0}
      idle-timeout-ms={60000}
      output-sample-rate={24000}
      style={{ width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      {...(active ? { config: settingsConfig } : {})}
    />
  );
};

export default VoiceAgentClient;

