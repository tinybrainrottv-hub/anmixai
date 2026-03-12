"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningProps {
  children: React.ReactNode;
  isStreaming?: boolean;
}

interface ReasoningTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

interface ReasoningContentProps {
  children: React.ReactNode;
  className?: string;
}

function Reasoning({ children, isStreaming = false }: ReasoningProps) {
  return <div className="reasoning-root">{children}</div>;
}

function ReasoningTrigger({ children, className }: ReasoningTriggerProps) {
  return (
    <DropdownMenuTrigger
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all text-[11px] font-medium",
        className
      )}
    >
      {children ?? (
        <>
          <Sparkles size={12} className="text-blue-400/80" />
          <span>Thinking</span>
          <ChevronDown size={12} className="opacity-60" />
        </>
      )}
    </DropdownMenuTrigger>
  );
}

function ReasoningContent({ children, className }: ReasoningContentProps) {
  return (
    <DropdownMenuContent
      align="start"
      side="top"
      className={cn(
        "min-w-[280px] max-w-[420px] max-h-[320px] overflow-y-auto border-white/10 bg-[#0a0f1a] text-slate-200 p-3",
        className
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-2">
        Reasoning
      </div>
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-slate-300 border-l-2 border-l-blue-500/50 pl-2">
        {children}
      </div>
    </DropdownMenuContent>
  );
}

export function ReasoningBlock({
  reasoning,
  isStreaming,
}: {
  reasoning: string;
  isStreaming?: boolean;
}) {
  return (
    <DropdownMenu>
      <ReasoningTrigger>
        <Sparkles size={12} className="text-blue-400/80" />
        <span className={isStreaming ? "anmix-shimmer-text" : ""}>Thinking</span>
        <ChevronDown size={12} className="opacity-60" />
      </ReasoningTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="min-w-[280px] max-w-[420px] max-h-[320px] overflow-y-auto border-white/10 bg-[#0a0f1a] text-slate-200 p-3"
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-2">
          Reasoning
        </div>
        <div className="text-xs leading-relaxed whitespace-pre-wrap text-slate-300 border-l-2 border-l-blue-500/50 pl-2">
          {reasoning}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
