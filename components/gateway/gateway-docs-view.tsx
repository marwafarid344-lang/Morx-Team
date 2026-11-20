"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  Code2,
  FileJson,
  Sparkles,
  Info,
  Server,
  Activity,
  Gauge,
  Workflow
} from "lucide-react"

export function GatewayDocsView() {
  const [activeTab, setActiveTab] = useState<"envelope" | "auth" | "limits" | "failover" | "errors">("envelope")
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<string>("data")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(id)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const ENVELOPE_FIELDS = [
    {
      name: "success",
      type: "boolean",
      desc: "Overall operation outcome. True on complete success; false when an error occurs or circuit breaker trips.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    },
    {
      name: "service",
      type: "string",
      desc: "Target service category namespace (videos, weather, maps, routing, social) for schema isolation.",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30"
    },
    {
      name: "data",
      type: "object | array | null",
      desc: "Cleaned, standardized payload. Normalized format is identical regardless of which upstream provider fulfilled the request.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30"
    },
    {
      name: "meta",
      type: "object",
      desc: "Operational telemetry: upstream provider used, cache hit flag, server latency in ms, and unique request UUID.",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30"
    },
    {
      name: "errors",
      type: "array",
      desc: "Structured errors array with error codes, messages, and retryability flags. Returns [] on success.",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30"
    }
  ]

  const NAV_TABS = [
    { id: "envelope", label: "Response Envelope", icon: FileJson },
    { id: "auth", label: "Authentication & Headers", icon: ShieldCheck },
    { id: "limits", label: "Rate Limits & Quota Guard", icon: Gauge },
    { id: "failover", label: "Resilience & Failover", icon: Workflow },
    { id: "errors", label: "Error Standards & Retries", icon: AlertTriangle },
  ] as const

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER HERO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-border/70 relative overflow-hidden shadow-xs"
      >
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            <Sparkles className="size-3.5" /> Gateway Architecture & Specifications
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Data Organization, Quotas, and Resilience
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Detailed technical guide on Morx standard JSON envelopes, intelligent in-memory caching, upstream quota protection, automatic provider failover, and retry policies.
          </p>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* HORIZONTAL NAV TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none border-b border-border/60 pb-2 text-xs">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                isActive
                  ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted/50"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: UNIFIED RESPONSE ENVELOPE */}
      {/* ===================================================================== */}
      {activeTab === "envelope" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Interactive Field Inspector */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Unified Response Envelope Schema</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every API call across Morx (YouTube, OpenWeather, Google Maps, Route Optimizer, Social) strictly adheres to this 5-key contract:
              </p>

              <div className="space-y-2 pt-1">
                {ENVELOPE_FIELDS.map((f) => (
                  <motion.div
                    key={f.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedField(f.name)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedField === f.name
                        ? "bg-card border-primary/50 shadow-sm ring-1 ring-primary/20"
                        : "bg-card/50 border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono font-bold text-foreground">.{f.name}</code>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${f.color}`}>
                          {f.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">inspect &rarr;</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {f.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Live Annotated JSON Visualizer */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Code2 className="size-3.5 text-primary" /> Live Standard Envelope JSON Example
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          success: true,
                          service: "videos",
                          data: [
                            {
                              id: "v_alex_123",
                              provider: "youtube",
                              title: "Alexandria Egypt — Citadel & Corniche",
                              url: "https://youtube.com/watch?v=v_alex_123",
                              duration_seconds: 480,
                              statistics: { views: 125000, likes: 8400 }
                            }
                          ],
                          meta: {
                            provider: "youtube",
                            providers_used: ["youtube"],
                            cached: true,
                            latency_ms: 12,
                            request_id: "req_f84b91c2_2026",
                            timestamp: "2026-11-16T22:00:00.000Z",
                            quota_cost: 0
                          },
                          errors: []
                        },
                        null,
                        2
                      ),
                      "json-envelope"
                    )
                  }
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedSection === "json-envelope" ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Check className="size-3" /> Copied JSON!
                    </span>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-300 overflow-x-auto shadow-inner leading-relaxed">
                <pre>{`{
  `}<span className={selectedField === "success" ? "bg-emerald-500/25 text-emerald-300 font-bold px-1 rounded" : "text-emerald-400"}>{`"success": true`}</span>{`,
  `}<span className={selectedField === "service" ? "bg-blue-500/25 text-blue-300 font-bold px-1 rounded" : "text-blue-400"}>{`"service": "videos"`}</span>{`,
  `}<span className={selectedField === "data" ? "bg-purple-500/25 text-purple-300 font-bold px-1 rounded" : "text-purple-400"}>{`"data": [`}</span>{`
    {
      "id": "v_alex_123",
      "provider": "youtube",
      "title": "Alexandria Egypt — Citadel & Corniche",
      "thumbnail": "https://i.ytimg.com/vi/v_alex_123/hqdefault.jpg",
      "url": "https://youtube.com/watch?v=v_alex_123",
      "creator": { "name": "Visit Egypt Official" },
      "duration_seconds": 480,
      "statistics": { "views": 125000, "likes": 8400 },
      "location": { "lat": 31.2, "lon": 29.9 }
    }
  ],
  `}<span className={selectedField === "meta" ? "bg-amber-500/25 text-amber-300 font-bold px-1 rounded" : "text-amber-400"}>{`"meta": {`}</span>{`
    "provider": "youtube",
    "providers_used": ["youtube"],
    "cached": true,              `}<span className="text-zinc-500">// Instant cache hit</span>{`
    "latency_ms": 14,            `}<span className="text-zinc-500">// Ultra-fast response</span>{`
    "request_id": "req_f84b91c2_2026",
    "timestamp": "2026-11-16T22:00:00.000Z",
    "quota_cost": 0              `}<span className="text-zinc-500">// Zero quota consumed</span>{`
  },
  `}<span className={selectedField === "errors" ? "bg-rose-500/25 text-rose-300 font-bold px-1 rounded" : "text-rose-400"}>{`"errors": []`}</span>{`
}`}</pre>
              </div>

              {/* Developer Benefit Box */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 flex items-start gap-3 text-xs">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-foreground">Why this eliminates 80% of frontend integration effort:</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Instead of writing distinct, fragile parsers for YouTube, Google Maps, OpenWeather, and Instagram, your frontend consumes one predictable format. Swapping an underlying vendor in the future requires zero frontend code changes.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AUTHENTICATION & HEADERS */}
      {/* ===================================================================== */}
      {activeTab === "auth" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm">Standard Authorization Header</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Include your API key as a Bearer token in the standard HTTP Authorization header:
              </p>
              <code className="block p-2.5 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground border border-border/50">
                Authorization: Bearer &lt;API_KEY&gt;
              </code>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm">Cryptographic Verification</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keys are SHA-256 hashed and verified in constant time to eliminate side-channel timing attacks.
              </p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                Constant-Time SHA-256 Active
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm">Pre-Seeded Demo Key</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A permanent, verified key pre-configured for graduation project development and instant testing:
              </p>
              <code className="block p-2 rounded-xl bg-muted/60 font-mono text-[10px] text-primary truncate border border-border/50 select-all">
                morx_live_grad_project_2026_demo_key
              </code>
            </div>

          </div>

          {/* Quick Request Snippets */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Code2 className="size-4 text-primary" /> Ready-to-Run Code Examples
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-mono">cURL Terminal Command:</span>
                <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 overflow-x-auto whitespace-pre-wrap">
{`curl -X GET "https://YOUR-DOMAIN/api/v1/weather/current?city=Alexandria" \\
  -H "Authorization: Bearer morx_live_grad_project_2026_demo_key"`}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-mono">JavaScript / Next.js Fetch:</span>
                <pre className="p-4 rounded-xl bg-zinc-950 text-blue-300 font-mono text-xs border border-zinc-800 overflow-x-auto whitespace-pre-wrap">
{`const res = await fetch("https://YOUR-DOMAIN/api/v1/weather/current?city=Alexandria", {
  headers: {
    "Authorization": "Bearer morx_live_grad_project_2026_demo_key"
  }
});
const { data, meta } = await res.json();
console.log(data.temperature); // 24°C`}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: RATE LIMITS & SMART CACHE */}
      {/* ===================================================================== */}
      {activeTab === "limits" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sliding Window Rate Limiting */}
            <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Gauge className="size-4 text-primary" /> Sliding Window Rate Limiter
                </h4>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  Sliding Window
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                The gateway enforces a sliding-window counter algorithm to prevent server congestion and ensure fair usage:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between border border-border/40">
                  <span className="text-muted-foreground">Per Minute Limit:</span>
                  <span className="font-mono font-bold text-foreground">120 requests / min</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between border border-border/40">
                  <span className="text-muted-foreground">Per Hour Limit:</span>
                  <span className="font-mono font-bold text-foreground">3,000 requests / hour</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between border border-border/40">
                  <span className="text-muted-foreground">Per Day Limit:</span>
                  <span className="font-mono font-bold text-foreground">25,000 requests / day</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400">
                When limits are exceeded, the gateway responds with HTTP 429 and includes a <code>Retry-After</code> header in seconds.
              </div>
            </div>

            {/* In-Memory TTL Cache Table */}
            <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" /> In-Memory TTL Quota Guard
                </h4>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                  TTL Caching
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                To prevent burning expensive YouTube and Google Maps quotas during testing or live demos, repeated queries are cached:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between border border-border/40">
                  <div>
                    <span className="font-bold text-foreground block">Video Search (YouTube)</span>
                    <span className="text-[10px] text-muted-foreground">Saves 100 quota units per call</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">10 Minutes</span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between border border-border/40">
                  <div>
                    <span className="font-bold text-foreground block">Weather Forecast & AQI</span>
                    <span className="text-[10px] text-muted-foreground">High-frequency atmospheric data</span>
                  </div>
                  <span className="font-mono font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded">15 Minutes</span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between border border-border/40">
                  <div>
                    <span className="font-bold text-foreground block">Maps Geocoding & Places</span>
                    <span className="text-[10px] text-muted-foreground">Static geographic coordinate cache</span>
                  </div>
                  <span className="font-mono font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">24 Hours</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary">
                <strong>Request Coalescing:</strong> If 10 concurrent requests arrive for the exact same query, only one upstream request is dispatched, and the result is broadcast to all callers instantly.
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: FAILOVER & CIRCUIT BREAKER */}
      {/* ===================================================================== */}
      {activeTab === "failover" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/70 space-y-6">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Workflow className="size-5 text-primary" />
                Automatic Failover & Circuit Breaker Architecture
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                The gateway is engineered to guarantee zero downtime even if an upstream provider like Google Maps suffers an outage or reaches quota exhaustion.
              </p>
            </div>

            {/* Visual State Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">1. CLOSED (Normal)</span>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Requests route to the Primary Provider. Latencies and HTTP status codes are tracked in real-time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">2. OPEN (Tripped)</span>
                  <span className="size-2 rounded-full bg-rose-500" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  After 5 consecutive failures or HTTP 5xx errors, the circuit trips immediately. Calls bypass the failing provider and reroute to the Fallback Provider.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">3. HALF-OPEN (Trial)</span>
                  <span className="size-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  After a 30-second reset window, a single trial request tests recovery. If successful, the circuit resets to CLOSED automatically.
                </p>
              </div>

            </div>

            {/* Production Implementations in Morx */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3 text-xs">
              <h4 className="font-bold text-foreground">Production Resilience Features in Morx:</h4>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Google Maps &harr; Mapbox Failover:</strong> If Google Geocoding or Places fails or exceeds quota, the gateway instantly falls back to Mapbox, returning the identical normalized JSON schema.
                </li>
                <li>
                  <strong className="text-foreground">Zero-Cost Offline 2-Opt TSP Solver:</strong> Morx embeds an in-house Traveling Salesperson heuristic algorithm that sequences delivery and tourist stops locally on the server with 0 external API calls and $0 billing cost.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: ERROR CODES & RETRIES */}
      {/* ===================================================================== */}
      {activeTab === "errors" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Standard Error Taxonomy & Retry Rules
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every error envelope contains a boolean <code>retryable</code> flag. When <code>true</code>, your client application can safely retry after a brief delay using exponential backoff.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border/60 font-mono">
                  <tr>
                    <th className="p-3">Error Code</th>
                    <th className="p-3">HTTP Status</th>
                    <th className="p-3">Retryable?</th>
                    <th className="p-3">Description & Client Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  <tr>
                    <td className="p-3 font-bold text-rose-400">UNAUTHORIZED_CLIENT</td>
                    <td className="p-3">401</td>
                    <td className="p-3 text-rose-500 font-bold">false</td>
                    <td className="p-3 font-sans text-muted-foreground">Missing or invalid API key. Verify Authorization header format.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-amber-400">RATE_LIMIT_EXCEEDED</td>
                    <td className="p-3">429</td>
                    <td className="p-3 text-emerald-400 font-bold">true</td>
                    <td className="p-3 font-sans text-muted-foreground">Rate limit reached. Honor the Retry-After header before resending.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-purple-400">CIRCUIT_BREAKER_OPEN</td>
                    <td className="p-3">503</td>
                    <td className="p-3 text-emerald-400 font-bold">true</td>
                    <td className="p-3 font-sans text-muted-foreground">Upstream service undergoing maintenance. Retry after 30 seconds.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-blue-400">PROVIDER_API_ERROR</td>
                    <td className="p-3">502</td>
                    <td className="p-3 text-emerald-400 font-bold">true</td>
                    <td className="p-3 font-sans text-muted-foreground">Upstream provider returned 5xx. Eligible for exponential backoff retry.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400">INVALID_PARAMETERS</td>
                    <td className="p-3">400</td>
                    <td className="p-3 text-rose-500 font-bold">false</td>
                    <td className="p-3 font-sans text-muted-foreground">Malformed inputs or missing required parameters. Do not retry without modifying payload.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  )
}
