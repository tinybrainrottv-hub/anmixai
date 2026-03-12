"use client";

import React from "react";
import { Terminal } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface AITerminalBoxProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

function MacControls() {
  return (
    <>
      <Terminal className="text-slate-500 mr-2 size-4 shrink-0" />
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <div className="h-2 w-2 rounded-full bg-yellow-500" />
      <div className="h-2 w-2 rounded-full bg-green-500" />
    </>
  );
}

export function AITerminalBox({ children, content, className }: AITerminalBoxProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1a] shadow-xl",
        className
      )}
    >
      <div className="flex flex-row items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2 sm:px-4">
        <div className="flex flex-row items-center gap-2 min-w-0">
          <MacControls />
          <span className="text-[10px] font-medium text-slate-400 truncate">ANMIX AI</span>
        </div>
        <CopyButton
          text={content}
          className="h-7 w-7 shrink-0 rounded-md border-white/10 bg-transparent hover:bg-white/10 text-slate-400 hover:text-white"
          size="icon"
        />
      </div>
      <div className="min-h-[80px] bg-gradient-to-b from-[#0d1321] to-[#0a0f1a] p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
}
