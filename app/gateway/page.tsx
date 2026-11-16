"use client";

import { useState, useEffect } from "react";
import { 
  Server, 
  Activity, 
  Key, 
  FlaskConical, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Copy, 
  Check,
  ExternalLink,
  Compass,
  CloudSun,
  Video,
  Navigation,
  Share2,
  Play
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const PRESETS = [
  {
    name: "Alexandria Weather",
    service: "weather",
    provider: "openweather",
    operation: "current",
    params: { city: "Alexandria", unit: "celsius" },
  },
  {
    name: "YouTube Video Search",
    service: "videos",
    provider: "youtube",
    operation: "search",
    params: { q: "Bibliotheca Alexandrina", limit: 3 },
  },
  {
    name: "2-Opt Route Optimizer (TSP)",
    service: "routing",
    provider: "internal_tsp",
    operation: "optimize",
    params: {
      origin: { lat: 31.2001, lon: 29.9187 },
      stops: [
        { id: "A", lat: 31.2089, lon: 29.9092 },
        { id: "B", lat: 31.2150, lon: 29.9500 },
        { id: "C", lat: 31.1900, lon: 29.9200 },
      ],
      destination: { lat: 31.1800, lon: 29.9000 },
    },
  },
  {
    name: "Address Geocoding",
    service: "maps",
    provider: "google_maps",
    operation: "geocode",
    params: { address: "Bibliotheca Alexandrina, Alexandria, Egypt" },
  },
];

export default function GatewayAdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "providers" | "clients" | "lab">("overview");
  const [analytics, setAnalytics] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Client Form State
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Testing Lab State
  const [testService, setTestService] = useState("weather");
  const [testProvider, setTestProvider] = useState("openweather");
  const [testOperation, setTestOperation] = useState("current");
  const [testParams, setTestParams] = useState('{"city": "Alexandria", "unit": "celsius"}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingLoading, setTestingLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, providersRes, clientsRes] = await Promise.all([
        fetch("/api/v1/gateway/analytics").then((r) => r.json()).catch(() => ({})),
        fetch("/api/v1/gateway/providers").then((r) => r.json()).catch(() => ({})),
        fetch("/api/v1/gateway/clients").then((r) => r.json()).catch(() => ({})),
      ]);

      setAnalytics(analyticsRes?.data || null);
      setProviders(providersRes?.data || []);
      setClients(clientsRes?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    try {
      const res = await fetch("/api/v1/gateway/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          description: newClientDesc,
          allowed_services: ["*"],
          rate_limit_per_minute: 120,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.data.apiKey);
        setNewClientName("");
        setNewClientDesc("");
        fetchData();
      }
    } catch (err) {
      alert("Failed to generate API Key");
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTestService(preset.service);
    setTestProvider(preset.provider);
    setTestOperation(preset.operation);
    setTestParams(JSON.stringify(preset.params, null, 2));
  };

  const handleRunTest = async () => {
    setTestingLoading(true);
    setTestResult(null);

    let parsedParams = {};
    try {
      parsedParams = JSON.parse(testParams);
    } catch {
      alert("Please ensure your parameters are valid JSON.");
      setTestingLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/gateway/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: testService,
          provider: testProvider,
          operation: testOperation,
          params: parsedParams,
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-primary/20">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 py-10 space-y-8">
        
        {/* Simple & Elegant Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-emerald-500" /> Gateway Control Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2">API Intelligence & Lab</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Monitor provider latency, generate graduation project keys, and test APIs live.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/70 text-xs font-medium hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <a
              href="/api/v1/docs/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="size-3.5" /> OpenAPI
            </a>
          </div>
        </div>

        {/* Minimalist Pill Navigation (Smooth wrap, zero scrollbar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap no-scrollbar scrollbar-none pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "overview"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Activity className="size-3.5" /> Metrics
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "lab"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <FlaskConical className="size-3.5" /> Testing Lab
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "providers"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Server className="size-3.5" /> Providers ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "clients"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Key className="size-3.5" /> API Keys
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground">Total Requests</span>
                <p className="text-2xl font-bold text-foreground">{analytics?.totalRequests ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Aggregated across all APIs</p>
              </div>
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground">Success Rate</span>
                <p className="text-2xl font-bold text-emerald-500">
                  {analytics?.totalRequests
                    ? `${Math.round((analytics.successfulRequests / analytics.totalRequests) * 100)}%`
                    : "100%"}
                </p>
                <p className="text-[10px] text-muted-foreground">Circuit breaker protected</p>
              </div>
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground">Avg Latency</span>
                <p className="text-2xl font-bold text-foreground">{analytics?.averageLatencyMs ?? 0} ms</p>
                <p className="text-[10px] text-muted-foreground">Normalized response time</p>
              </div>
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground">Cache Hit Ratio</span>
                <p className="text-2xl font-bold text-sky-500">{analytics?.cache?.hitRatio ?? "0.00"}</p>
                <p className="text-[10px] text-muted-foreground">{analytics?.cache?.hits ?? 0} queries served from memory</p>
              </div>
            </div>

            {/* Quickstart Card */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <h2 className="text-base font-bold">Graduation Project Integration in 3 Lines</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can query any service via simple HTTP fetch. Pass your API key in the authorization header:
              </p>

              <pre className="p-4 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 overflow-x-auto space-y-1">
                <span className="text-muted-foreground">// Search YouTube videos</span><br/>
                <span className="text-emerald-400">const res = await fetch("https://YOUR-DOMAIN/api/v1/videos/search?q=Alexandria", &#123;</span><br/>
                <span className="text-emerald-400">  headers: &#123; "Authorization": "Bearer morx_live_grad_project_2026_demo_key" &#125;</span><br/>
                <span className="text-emerald-400">&#125;);</span>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: TESTING LAB (ENHANCED WITH 1-CLICK PRESETS) */}
        {activeTab === "lab" && (
          <div className="space-y-6">
            
            {/* Quick 1-Click Presets */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Play className="size-3 text-primary" /> Click a Preset to Try Instantly:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="px-3 py-1.5 rounded-xl bg-card border border-border/70 text-xs font-medium hover:border-primary/60 hover:text-primary transition-all text-foreground"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Two Column Testing Workspace */}
            <div className="grid lg:grid-cols-2 gap-5">
              
              {/* Form Input */}
              <div className="p-5 rounded-3xl bg-card border border-border/70 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FlaskConical className="size-4 text-primary" /> Request Config
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-muted-foreground font-medium block mb-1">Service</label>
                    <select
                      value={testService}
                      onChange={(e) => setTestService(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-border/70 bg-background text-foreground"
                    >
                      <option value="weather">Weather Service</option>
                      <option value="videos">Videos Discovery</option>
                      <option value="maps">Maps & Geolocation</option>
                      <option value="routing">Route Optimizer</option>
                      <option value="tiktok">TikTok Display</option>
                      <option value="instagram">Instagram Graph</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-muted-foreground font-medium block mb-1">Provider</label>
                      <input
                        type="text"
                        value={testProvider}
                        onChange={(e) => setTestProvider(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border/70 bg-background text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground font-medium block mb-1">Operation</label>
                      <input
                        type="text"
                        value={testOperation}
                        onChange={(e) => setTestOperation(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border/70 bg-background text-foreground font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted-foreground font-medium block mb-1">Parameters (JSON)</label>
                    <textarea
                      rows={6}
                      value={testParams}
                      onChange={(e) => setTestParams(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border/70 bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <button
                    onClick={handleRunTest}
                    disabled={testingLoading}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    {testingLoading ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />}
                    Execute Real Provider Call
                  </button>
                </div>
              </div>

              {/* Output Viewer */}
              <div className="p-5 rounded-3xl bg-card border border-border/70 space-y-3 flex flex-col">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Normalized Response</span>
                  {testResult && (
                    <span className="font-mono text-muted-foreground">{testResult.latencyMs} ms</span>
                  )}
                </div>

                <div className="flex-1 rounded-2xl bg-zinc-950 p-4 border border-zinc-800 text-xs font-mono text-zinc-100 overflow-y-auto max-h-[380px]">
                  {testingLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      <RefreshCw className="size-4 animate-spin mr-2" /> Dispatching request...
                    </div>
                  ) : testResult ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
                  ) : (
                    <p className="text-zinc-600">Select a preset above and click "Execute" to inspect live response.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PROVIDERS */}
        {activeTab === "providers" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {providers.map((p) => (
              <div key={p.name} className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm capitalize flex items-center gap-1.5">
                      {p.service === "weather" && <CloudSun className="size-3.5 text-amber-500" />}
                      {p.service === "videos" && <Video className="size-3.5 text-red-500" />}
                      {p.service === "maps" && <Compass className="size-3.5 text-blue-500" />}
                      {p.service === "routing" && <Navigation className="size-3.5 text-emerald-500" />}
                      {p.service === "tiktok" && <Share2 className="size-3.5 text-pink-500" />}
                      {p.service === "instagram" && <Share2 className="size-3.5 text-purple-500" />}
                      {p.name.replace("_", " ")}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        p.available
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {p.available ? "Active" : "Awaiting Key"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {p.capabilities?.notes || `Integrated provider for ${p.service}.`}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground flex justify-between">
                  <span>Circuit: <strong className="text-foreground uppercase">{p.circuitState}</strong></span>
                  <span>Calls today: <strong className="text-foreground">{p.dailyUsage?.quotaUnitsConsumed || 0}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: API KEYS */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            {/* Generate Key Form */}
            <form onSubmit={handleCreateClient} className="p-5 rounded-3xl bg-card border border-border/70 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key className="size-4 text-primary" /> Issue New Client API Key
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Application Name (e.g. Graduation Mobile App)"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-border/70 bg-background text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Notes / Description"
                  value={newClientDesc}
                  onChange={(e) => setNewClientDesc(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-border/70 bg-background text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Generate API Key
              </button>
            </form>

            {generatedKey && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Newly Generated API Key (Save it now):</p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border font-mono text-xs">
                  <span className="select-all">{generatedKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-1 hover:text-primary"
                  >
                    {copiedKey ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Clients List */}
            <div className="border border-border/70 rounded-2xl overflow-hidden bg-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Application</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Rate Limit</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 font-medium">
                        <p className="font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{c.id}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{c.rateLimitPerMinute} req/min</td>
                      <td className="p-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
