import React from "react";

/**
 * Official / Recognizable Programming Language Brand Logos
 * Used across API Documentation and Connection Snippets
 */

export function CurlLogo({ className = "size-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="cURL">
      <rect width="24" height="24" rx="5" fill="#0F172A" />
      <path
        d="M5 8.5L9.5 12L5 15.5"
        stroke="#10B981"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="11"
        y1="16"
        x2="18"
        y2="16"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function JavaScriptLogo({ className = "size-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="JavaScript">
      <rect width="24" height="24" rx="4.5" fill="#F7DF1E" />
      <path
        d="M7.5 17.5c.5.8 1.2 1.3 2.2 1.3 1.2 0 2-.6 2-1.8v-6.5h-2v6.4c0 .5-.2.8-.7.8-.4 0-.6-.2-.8-.6l-.7.4zm7.2-.1c.6.9 1.5 1.4 2.6 1.4 1.8 0 2.9-1 2.9-2.5 0-1.4-.8-2-2.3-2.6l-.7-.3c-.8-.3-1.2-.6-1.2-1.2 0-.6.5-1.1 1.3-1.1.7 0 1.2.3 1.6.9l1.4-.9c-.6-1-1.6-1.5-3-1.5-1.8 0-2.9 1.1-2.9 2.5 0 1.3.8 2 2.2 2.6l.7.3c.9.4 1.3.7 1.3 1.3 0 .7-.6 1.2-1.5 1.2-.9 0-1.5-.5-1.9-1.2l-1.4.6z"
        fill="#000000"
      />
    </svg>
  );
}

export function PythonLogo({ className = "size-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Python">
      <path
        d="M11.91 2c-5.07 0-4.75 2.19-4.75 2.19l.01 2.27h4.82v.69H5.16S2 6.78 2 11.92c0 5.14 2.76 4.96 2.76 4.96h1.64v-2.32s-.09-2.76 2.72-2.76h4.67s2.63.04 2.63-2.56V4.65S16.98 2 11.91 2zm-2.6 1.48c.47 0 .86.38.86.86 0 .47-.39.86-.86.86-.47 0-.86-.39-.86-.86 0-.48.39-.86.86-.86z"
        fill="#3776AB"
      />
      <path
        d="M12.09 22c5.07 0 4.75-2.19 4.75-2.19l-.01-2.27H12v-.69h6.84S22 17.22 22 12.08c0-5.14-2.76-4.96-2.76-4.96h-1.64v2.32s.09 2.76-2.72 2.76H10.2s-2.63-.04-2.63 2.56v4.58S7.02 22 12.09 22zm2.6-1.48c-.47 0-.86-.38-.86-.86 0-.47.39-.86.86-.86.47 0 .86.39.86.86 0 .48-.39.86-.86.86z"
        fill="#FFD438"
      />
    </svg>
  );
}

export function DartLogo({ className = "size-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Dart">
      <path d="M4.2 3.8L11.5 3.8L20 12.3L16.2 20.2L4.2 15.8V3.8Z" fill="#0175C2" />
      <path d="M4.2 3.8L11.5 11.1L8.2 20.2L4.2 15.8V3.8Z" fill="#13B9FD" />
      <path d="M11.5 3.8L20 12.3L16.2 20.2L11.5 11.1V3.8Z" fill="#02569B" />
      <path d="M8.2 20.2L16.2 20.2L11.5 15.5L8.2 20.2Z" fill="#01579B" />
    </svg>
  );
}

/**
 * Unified Language Brand Dispatcher
 */
export function LanguageLogo({
  lang,
  className = "size-3.5 shrink-0",
}: {
  lang: string;
  className?: string;
}) {
  const norm = lang.toLowerCase().trim();

  if (norm === "curl" || norm === "bash" || norm === "shell" || norm === "sh") {
    return <CurlLogo className={className} />;
  }
  if (norm === "js" || norm === "javascript" || norm === "ts" || norm === "typescript" || norm === "node") {
    return <JavaScriptLogo className={className} />;
  }
  if (norm === "python" || norm === "py") {
    return <PythonLogo className={className} />;
  }
  if (norm === "dart" || norm === "flutter") {
    return <DartLogo className={className} />;
  }

  return <CurlLogo className={className} />;
}
