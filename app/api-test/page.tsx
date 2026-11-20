'use client';

import { useEffect } from 'react';

export default function ApiTestRedirectPage() {
  useEffect(() => {
    window.location.href = '/api-test.html';
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-sm font-semibold">Opening MORX API Testing Lab...</h2>
      <p className="text-xs text-slate-400 mt-1">
        If you are not redirected automatically, <a href="/api-test.html" className="text-blue-400 underline">click here</a>.
      </p>
    </div>
  );
}
