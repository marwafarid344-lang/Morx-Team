'use client';

import { useEffect } from 'react';

export default function InstagramTestPage() {
  useEffect(() => {
    window.location.href = '/instagram-test.html';
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1015] text-white flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-2 border-[#E1306C] border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-sm font-semibold">Opening Instagram Testing Lab...</h2>
      <p className="text-xs text-slate-400 mt-1">
        If you are not redirected automatically, <a href="/instagram-test.html" className="text-[#E1306C] underline">click here</a>.
      </p>
    </div>
  );
}

