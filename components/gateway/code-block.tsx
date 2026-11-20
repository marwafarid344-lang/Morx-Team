"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
  showCopy?: boolean;
  maxHeight?: string;
}

// Map short language names to Prism canonical names
function normalizeLanguage(lang: string): string {
  const l = lang.toLowerCase().trim();
  switch (l) {
    case "curl":
    case "sh":
    case "shell":
      return "bash";
    case "js":
    case "node":
      return "javascript";
    case "ts":
      return "typescript";
    case "py":
      return "python";
    case "dart":
    case "flutter":
      return "dart";
    case "json":
      return "json";
    default:
      return l || "text";
  }
}

// Custom theme based on Atom One Dark with seamless transparent container
const transparentOneDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "transparent",
    margin: 0,
    padding: 0,
    border: "none",
    boxShadow: "none",
    fontSize: "0.8125rem", // 13px
    lineHeight: "1.65",
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
};

export function CodeBlock({
  code,
  language,
  className = "",
  showCopy = true,
  maxHeight,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const normalizedLang = normalizeLanguage(language);
  const trimmedCode = (typeof code === "string" ? code : JSON.stringify(code, null, 2)).trim();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trimmedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative group rounded-2xl bg-zinc-950/90 border border-border/70 overflow-hidden shadow-xs ${className}`}
    >
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition-all opacity-80 group-hover:opacity-100 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      )}

      <div
        className="p-4 overflow-x-auto text-xs"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <SyntaxHighlighter
          language={normalizedLang}
          style={transparentOneDark}
          PreTag="div"
          wrapLines={false}
          wrapLongLines={false}
        >
          {trimmedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
