"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Terminal } from "lucide-react";

interface FormattedMessageProps {
  content: string;
  role: "user" | "assistant";
}

function TerminalBarDots() {
  return (
    <>
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <div className="h-2 w-2 rounded-full bg-yellow-500" />
      <div className="h-2 w-2 rounded-full bg-green-500" />
    </>
  );
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0a0f1a] shadow-2xl">
      {/* Terminal header: copy button alag upar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal size={14} className="text-blue-400 shrink-0" />
          <div className="flex items-center gap-1.5 shrink-0">
            <TerminalBarDots />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-[11px] font-medium"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy code"}</span>
        </button>
      </div>
      <div className="p-0 text-[11px] bg-gradient-to-b from-[#0d1321] to-[#0a0f1a]">
        <SyntaxHighlighter
          language={language || "text"}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            background: "transparent",
            fontSize: "11px",
            lineHeight: "1.6",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono), monospace",
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default function FormattedMessage({ content, role }: FormattedMessageProps) {
  if (role === "user") {
    // Left-align all lines; wrap long messages line by line
    return <div className="whitespace-pre-wrap break-words text-left">{content}</div>;
  }

  // Render assistant content statically (streaming already animates typing)
  return (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "text";
              return !inline ? (
                <CodeBlock
                  language={language}
                  value={String(children).replace(/\n$/, "")}
                />
              ) : (
                <code
                  className={`${className} bg-white/10 px-2 py-0.5 rounded text-blue-300 font-mono text-[11px] border border-white/5`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="mb-5 last:mb-0 leading-relaxed text-slate-200/90">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2 text-slate-200/90">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-slate-200/90">{children}</ol>,
            li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
            h1: ({ children }) => <h1 className="text-xl font-black mb-6 mt-2 text-white tracking-tight border-b border-white/5 pb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-5 mt-8 text-white tracking-tight">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold mb-4 mt-6 text-white tracking-tight">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500/30 pl-6 italic my-6 text-slate-400 bg-blue-500/5 py-4 rounded-r-xl">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6 border border-white/10 rounded-xl shadow-2xl bg-black/20 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-white/10">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 bg-white/5 text-left text-[11px] font-black uppercase tracking-widest text-blue-400">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 border-t border-white/5 text-[11px] text-slate-300 font-medium">
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );

}
