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
  Play,
  Trash2,
  Edit3,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Lock,
  Layers,
  Sparkles
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ApiAccessGuard } from "@/components/gateway/api-access-guard";

const GATEWAY_SERVICES = [
  { id: "videos", label: "Video Discovery", provider: "YouTube Data API v3", icon: Video, color: "text-red-400" },
  { id: "weather", label: "Weather Intelligence", provider: "OpenWeather", icon: CloudSun, color: "text-amber-400" },
  { id: "maps", label: "Maps & Geolocation", provider: "Google Maps & Mapbox", icon: Compass, color: "text-blue-400" },
  { id: "routing", label: "Route Optimizer", provider: "2-Opt TSP Solver", icon: Navigation, color: "text-emerald-400" },
  { id: "tiktok", label: "TikTok Feeds", provider: "TikTok API", icon: Share2, color: "text-pink-400" },
  { id: "instagram", label: "Instagram Graph", provider: "Meta Graph API", icon: Share2, color: "text-purple-400" },
];

const QUICK_ENDPOINTS = [
  {
    name: "Alexandria Weather (Current)",
    service: "weather",
    method: "GET",
    path: "/api/v1/weather/current?city=Alexandria",
    body: null,
  },
  {
    name: "2-Opt Route Optimization (3 Stops)",
    service: "routing",
    method: "POST",
    path: "/api/v1/routes/optimize",
    body: {
      origin: { lat: 31.2001, lon: 29.9187, name: "Bibliotheca Alexandrina" },
      stops: [
        { id: "stop_1", lat: 31.2139, lon: 29.8856, name: "Citadel of Qaitbay" },
        { id: "stop_2", lat: 31.2843, lon: 30.0163, name: "Montaza Palace" },
        { id: "stop_3", lat: 31.1871, lon: 29.8965, name: "Pompey's Pillar" }
      ],
      destination: { lat: 31.2001, lon: 29.9187, name: "Bibliotheca Alexandrina" }
    },
  },
  {
    name: "Alexandria Geocoding",
    service: "maps",
    method: "GET",
    path: "/api/v1/maps/geocode?address=Alexandria",
    body: null,
  },
  {
    name: "Places Search (Cafes)",
    service: "maps",
    method: "GET",
    path: "/api/v1/maps/places?query=Cafe&lat=31.2&lon=29.9",
    body: null,
  },
  {
    name: "YouTube Video Search",
    service: "videos",
    method: "GET",
    path: "/api/v1/videos/search?q=Alexandria&limit=2",
    body: null,
  },
  {
    name: "TikTok Creator Videos",
    service: "tiktok",
    method: "GET",
    path: "/api/v1/tiktok/videos?limit=2",
    body: null,
  },
];

export default function GatewayAdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "providers" | "clients" | "lab">("clients");
  const [analytics, setAnalytics] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Client Form State
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientServices, setNewClientServices] = useState<string[]>(["videos", "weather", "maps", "routing", "tiktok", "instagram"]);
  const [newClientRateLimit, setNewClientRateLimit] = useState<number>(120);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Edit Client Modal State
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editRateLimit, setEditRateLimit] = useState<number>(120);
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");

  // Testing Lab State
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);

  // Single Endpoint Quick Test
  const [selectedQuickEndpoint, setSelectedQuickEndpoint] = useState(QUICK_ENDPOINTS[0]);
  const [quickResult, setQuickResult] = useState<any>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, providersRes, clientsRes] = await Promise.all([
        fetch("/api/v1/gateway/analytics", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/v1/gateway/providers", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/v1/gateway/clients", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      ]);

      setAnalytics(analyticsRes?.data || null);
      setProviders(providersRes?.data || []);
      const clientsList = clientsRes?.data || [];
      setClients(clientsList);

      // Pre-select first available key if empty
      if (!selectedApiKey && clientsList.length > 0) {
        const firstWithKey = clientsList.find((c: any) => c.rawKey);
        if (firstWithKey) {
          setSelectedApiKey(firstWithKey.rawKey);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CREATE CLIENT
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const res = await fetch("/api/v1/gateway/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName.trim(),
          description: newClientDesc.trim(),
          allowed_services: newClientServices.length === GATEWAY_SERVICES.length ? ["*"] : newClientServices,
          rate_limit_per_minute: newClientRateLimit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.data.apiKey);
        setSelectedApiKey(data.data.apiKey);
        setNewClientName("");
        setNewClientDesc("");
        setNewClientServices(["videos", "weather", "maps", "routing", "tiktok", "instagram"]);
        fetchData();
      } else {
        alert(data.errors?.[0]?.message || "Failed to generate API Key");
      }
    } catch (err: any) {
      alert("Failed to create client: " + err.message);
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditDesc(client.description || "");
    const allowed = client.allowedServices || [];
    setEditServices(allowed.includes("*") ? GATEWAY_SERVICES.map(s => s.id) : allowed);
    setEditRateLimit(client.rateLimitPerMinute || 120);
    setEditStatus(client.status === "active" ? "active" : "suspended");
  };

  // SAVE EDITED CLIENT
  const handleSaveEdit = async () => {
    if (!editingClient) return;

    try {
      const res = await fetch("/api/v1/gateway/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingClient.id,
          name: editName.trim(),
          description: editDesc.trim(),
          allowed_services: editServices.length === GATEWAY_SERVICES.length ? ["*"] : editServices,
          rate_limit_per_minute: editRateLimit,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingClient(null);
        fetchData();
      } else {
        alert(data.errors?.[0]?.message || "Failed to update client");
      }
    } catch (err: any) {
      alert("Error updating client: " + err.message);
    }
  };

  // DELETE / REVOKE CLIENT
  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete and revoke the API key for "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/gateway/clients?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.errors?.[0]?.message || "Failed to delete client");
      }
    } catch (err: any) {
      alert("Error deleting client: " + err.message);
    }
  };

  // TOGGLE CLIENT STATUS
  const handleToggleStatus = async (client: any) => {
    const nextStatus = client.status === "active" ? "suspended" : "active";
    try {
      await fetch("/api/v1/gateway/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: client.id,
          status: nextStatus,
        }),
      });
      fetchData();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  // RUN MULTI-PROVIDER DIAGNOSTICS (Test All Providers)
  const handleRunDiagnostics = async () => {
    const apiKey = (customApiKey.trim() || selectedApiKey.trim());
    if (!apiKey) {
      alert("Please select or enter an API Key to test the providers.");
      return;
    }

    setDiagnosticsLoading(true);
    setDiagnosticResults([]);

    const tests = [
      { name: "OpenWeather (Weather Intelligence)", service: "weather", path: "/api/v1/weather/current?city=Alexandria", method: "GET" },
      { name: "Internal 2-Opt TSP (Route Optimizer)", service: "routing", path: "/api/v1/routes/optimize", method: "POST", body: QUICK_ENDPOINTS[1].body },
      { name: "Google Maps Geocoding", service: "maps", path: "/api/v1/maps/geocode?address=Alexandria", method: "GET" },
      { name: "Google Maps Places", service: "maps", path: "/api/v1/maps/places?query=Cafe&lat=31.2&lon=29.9", method: "GET" },
      { name: "YouTube Data API v3 (Videos)", service: "videos", path: "/api/v1/videos/search?q=Alexandria&limit=2", method: "GET" },
      { name: "TikTok Display API", service: "tiktok", path: "/api/v1/tiktok/videos?limit=2", method: "GET" },
    ];

    const results = [];
    for (const t of tests) {
      const startTime = performance.now();
      try {
        const fetchOpts: RequestInit = {
          method: t.method,
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json",
          },
        };
        if (t.method === "POST" && t.body) {
          (fetchOpts.headers as any)["Content-Type"] = "application/json";
          fetchOpts.body = JSON.stringify(t.body);
        }

        const res = await fetch(t.path, fetchOpts);
        const latencyMs = Math.round(performance.now() - startTime);
        let data = null;
        try {
          data = await res.json();
        } catch {}

        let message = "";
        if (res.status === 200) {
          message = "Operational & Healthy";
        } else if (res.status === 401) {
          message = "Unauthorized: Invalid or Missing API Key";
        } else if (res.status === 403) {
          message = data?.errors?.[0]?.message || "Forbidden: Service not granted to this key";
        } else if (res.status === 404) {
          message = "Not Found: Endpoint route missing";
        } else if (res.status === 502) {
          message = data?.errors?.[0]?.message || "Upstream Provider Error / Quota Exhausted";
        } else {
          message = data?.errors?.[0]?.message || `Error status: ${res.status}`;
        }

        results.push({
          name: t.name,
          service: t.service,
          path: t.path,
          status: res.status,
          latencyMs,
          ok: res.ok,
          message,
        });
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - startTime);
        results.push({
          name: t.name,
          service: t.service,
          path: t.path,
          status: "ERR",
          latencyMs,
          ok: false,
          message: err.message || "Network offline / Connection refused",
        });
      }
    }

    setDiagnosticResults(results);
    setDiagnosticsLoading(false);
  };

  // RUN SINGLE ENDPOINT QUICK TEST
  const handleRunSingleTest = async () => {
    const apiKey = (customApiKey.trim() || selectedApiKey.trim());
    if (!apiKey) {
      alert("Please select or enter an API Key to run test.");
      return;
    }

    setQuickLoading(true);
    setQuickResult(null);

    const startTime = performance.now();
    try {
      const fetchOpts: RequestInit = {
        method: selectedQuickEndpoint.method,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      };
      if (selectedQuickEndpoint.method === "POST" && selectedQuickEndpoint.body) {
        (fetchOpts.headers as any)["Content-Type"] = "application/json";
        fetchOpts.body = JSON.stringify(selectedQuickEndpoint.body);
      }

      const res = await fetch(selectedQuickEndpoint.path, fetchOpts);
      const latencyMs = Math.round(performance.now() - startTime);
      const data = await res.json().catch(() => ({ error: "Failed to parse JSON" }));

      setQuickResult({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        latencyMs,
        data,
      });
    } catch (err: any) {
      setQuickResult({
        status: "ERR",
        statusText: "Network Error",
        ok: false,
        latencyMs: Math.round(performance.now() - startTime),
        data: { error: err.message },
      });
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-primary/20">
      <Header />
      <ApiAccessGuard>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 py-10 space-y-8">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-emerald-500" /> Gateway Control Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2">API Intelligence & Lab</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Issue personalized client API keys, restrict provider access, and inspect real-time health diagnostics.
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
              href="/api"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Layers className="size-3.5" /> API Docs
            </a>
          </div>
        </div>

        {/* Minimalist Pill Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap pb-1">
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "clients"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Key className="size-3.5" /> API Keys & Access ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "lab"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <FlaskConical className="size-3.5" /> Testing Lab & Status
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "providers"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Server className="size-3.5" /> Providers Catalog ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "overview"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Activity className="size-3.5" /> Telemetry & Metrics
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: API KEYS & ACCESS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            
            {/* Generate Key Form */}
            <form onSubmit={handleCreateClient} className="p-6 rounded-3xl bg-card border border-border/70 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Key className="size-4 text-primary" /> Issue Personalized Client API Key
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono">Persistent Disk-Backed</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium block mb-1">Application / Client Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Graduation Mobile App"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border/70 bg-background text-xs focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium block mb-1">Description / Project Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. Tourism and trip planner module"
                    value={newClientDesc}
                    onChange={(e) => setNewClientDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border/70 bg-background text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Provider Access Selection */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground text-[11px]">Select Allowed Providers / Services:</span>
                  <div className="flex gap-2 text-[10px] text-primary">
                    <button 
                      type="button" 
                      onClick={() => setNewClientServices(GATEWAY_SERVICES.map(s => s.id))}
                      className="hover:underline font-mono"
                    >
                      Select All
                    </button>
                    <span>·</span>
                    <button 
                      type="button" 
                      onClick={() => setNewClientServices([])}
                      className="hover:underline font-mono text-muted-foreground"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GATEWAY_SERVICES.map((s) => {
                    const isChecked = newClientServices.includes(s.id);
                    const Icon = s.icon;
                    return (
                      <label 
                        key={s.id} 
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-xs select-none ${
                          isChecked 
                            ? "bg-primary/10 border-primary/40 text-foreground font-medium" 
                            : "bg-background/60 border-border/60 text-muted-foreground hover:border-border"
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewClientServices([...newClientServices, s.id]);
                            } else {
                              setNewClientServices(newClientServices.filter(id => id !== s.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <Icon className={`size-3.5 ${s.color} shrink-0`} />
                        <span className="truncate">{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">
                  Default rate limit: <strong className="text-foreground">120 requests / min</strong>
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="size-3.5" /> Issue API Key
                </button>
              </div>
            </form>

            {/* Newly Generated Key Alert Box */}
            {generatedKey && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> Newly Issued API Key (Active & Ready):
                  </p>
                  <span className="text-[10px] text-emerald-500 font-mono">Store securely</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-emerald-500/30 font-mono text-xs">
                  <span className="select-all text-emerald-400 font-bold">{generatedKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-mono text-[11px]"
                  >
                    {copiedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Existing Clients List */}
            <div className="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Registered API Clients</span>
                <span className="text-[11px] font-mono text-muted-foreground">{clients.length} Keys Active</span>
              </div>

              {clients.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <Key className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No API keys registered yet.</p>
                  <p>Use the form above to issue your first client API key and choose provider access.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">Application</th>
                        <th className="p-3.5">Allowed Providers</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">API Key</th>
                        <th className="p-3.5">Rate Limit</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {clients.map((c) => {
                        const allowed = c.allowedServices || [];
                        const isAll = allowed.includes("*") || allowed.length >= GATEWAY_SERVICES.length;
                        return (
                          <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3.5 font-medium">
                              <p className="font-bold text-foreground">{c.name}</p>
                              {c.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.id}</p>
                            </td>

                            <td className="p-3.5">
                              {isAll ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  All Services (*)
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {allowed.map((s: string) => (
                                    <span key={s} className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 capitalize">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5">
                              <button
                                onClick={() => handleToggleStatus(c)}
                                title="Click to toggle status"
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase cursor-pointer transition-all ${
                                  c.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20"
                                }`}
                              >
                                {c.status}
                              </button>
                            </td>

                            <td className="p-3.5 font-mono text-[11px]">
                              {c.rawKey ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-400 font-bold truncate max-w-[120px]">{c.rawKey.slice(0, 14)}...</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(c.rawKey);
                                      alert("Copied API Key to clipboard!");
                                    }}
                                    className="p-1 hover:text-primary transition-colors text-muted-foreground"
                                    title="Copy full key"
                                  >
                                    <Copy className="size-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">Active in Store</span>
                              )}
                            </td>

                            <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                              {c.rateLimitPerMinute} /min
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(c)}
                                  className="p-1.5 rounded-lg border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit Client & Providers"
                                >
                                  <Edit3 className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClient(c.id, c.name)}
                                  className="p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 transition-colors"
                                  title="Revoke & Delete API Key"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SIMPLIFIED TESTING LAB & LIVE STATUS */}
        {/* ========================================================================= */}
        {activeTab === "lab" && (
          <div className="space-y-6">
            
            {/* Control Bar: Select Key & Run Diagnostics */}
            <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <FlaskConical className="size-4 text-primary" /> Live Provider Diagnostics & Test Bench
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Test live provider integrations and detect which services return 200 OK or errors (401, 403, 502).
                  </p>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={diagnosticsLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 shrink-0"
                >
                  <RefreshCw className={`size-3.5 ${diagnosticsLoading ? "animate-spin" : ""}`} />
                  <span>{diagnosticsLoading ? "Testing All Providers..." : "⚡ Test All Providers in 1 Click"}</span>
                </button>
              </div>

              {/* API Key Selector */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium block mb-1">Select from Your Issued API Keys:</label>
                  <select
                    value={selectedApiKey}
                    onChange={(e) => {
                      setSelectedApiKey(e.target.value);
                      setCustomApiKey("");
                    }}
                    className="w-full p-2 rounded-xl border border-border/70 bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">-- Choose an active client key --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.rawKey || ""}>
                        {c.name} {c.rawKey ? `(${c.rawKey.slice(0, 16)}...)` : `(${c.id})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground font-medium block mb-1">Or Paste Any Custom API Key:</label>
                  <input
                    type="text"
                    placeholder="morx_live_..."
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border/70 bg-background text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Diagnostic Results Grid */}
            {diagnosticResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Real-Time Provider Diagnostic Matrix</span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {diagnosticResults.filter(r => r.ok).length} / {diagnosticResults.length} Operational
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {diagnosticResults.map((r, i) => (
                    <div 
                      key={i} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        r.ok 
                          ? "bg-emerald-500/5 border-emerald-500/30" 
                          : r.status === 401 || r.status === 403
                          ? "bg-rose-500/5 border-rose-500/30"
                          : "bg-amber-500/5 border-amber-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-foreground truncate">{r.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                            r.ok 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : r.status === 401 || r.status === 403
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {r.status === 200 ? "200 OK" : r.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {r.message}
                        </p>
                      </div>

                      <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="truncate max-w-[150px]">{r.path}</span>
                        <span className="font-bold text-foreground">{r.latencyMs} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Single Endpoint Tester */}
            <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4 shadow-xs">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" /> Interactive Single Endpoint Inspection
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                  {selectedQuickEndpoint.method}
                </span>
                <select
                  value={selectedQuickEndpoint.path}
                  onChange={(e) => {
                    const found = QUICK_ENDPOINTS.find(p => p.path === e.target.value);
                    if (found) setSelectedQuickEndpoint(found);
                  }}
                  className="flex-1 p-2 rounded-xl border border-border/70 bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  {QUICK_ENDPOINTS.map((p) => (
                    <option key={p.path} value={p.path}>
                      {p.name} — ({p.path})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRunSingleTest}
                  disabled={quickLoading}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  {quickLoading ? <RefreshCw className="size-3 animate-spin" /> : <Play className="size-3 fill-current" />}
                  <span>Execute</span>
                </button>
              </div>

              {/* Quick Result Viewer */}
              {quickResult && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      quickResult.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      Status: {quickResult.status} {quickResult.statusText}
                    </span>
                    <span className="text-muted-foreground">{quickResult.latencyMs} ms</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                    {JSON.stringify(quickResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROVIDERS CATALOG */}
        {/* ========================================================================= */}
        {activeTab === "providers" && (
          <div className="space-y-4">
            {/* Compliance & Licensing Banner */}
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/[0.03] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Mandatory API Compliance & Licensing Matrix Active</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  All third-party provider operations are governed by contractual redistribution, retention, and attribution policies.
                </p>
              </div>
              <a
                href="/docs"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-background font-semibold text-[11px] text-primary hover:bg-muted/40 transition-colors shrink-0"
              >
                <span>Compliance Specs</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {providers.map((p) => {
                const complianceStatus = p.compliance?.status || "CONDITIONAL";
                return (
                  <div key={p.name} className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between space-y-3 shadow-xs">
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
                        <div className="flex items-center gap-1.5">
                          {/* Compliance Status Badge */}
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight ${
                              complianceStatus === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : complianceStatus === "CONDITIONAL"
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : complianceStatus === "INTERNAL_ONLY"
                                ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                            title={`Compliance: ${complianceStatus}`}
                          >
                            {complianceStatus === "BLOCKED_PENDING_APPROVAL" ? "PENDING" : complianceStatus}
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
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {p.capabilities?.notes || `Integrated provider for ${p.service}.`}
                      </p>
                      {p.compliance?.attribution?.displayText && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic">
                          Attribution: {p.compliance.attribution.displayText}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground flex justify-between">
                      <span>Circuit: <strong className="text-foreground uppercase">{p.circuitState}</strong></span>
                      <span>Calls: <strong className="text-foreground">{p.dailyUsage?.quotaUnitsConsumed || 0}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: METRICS & TELEMETRY */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
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
                <p className="text-2xl font-bold text-sky-500">{analytics?.cacheHitRate ?? "0"}%</p>
                <p className="text-[10px] text-muted-foreground">In-memory TTL optimization</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <h2 className="text-base font-bold">Standard Client Request Pattern</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Query any service via simple HTTP fetch. Pass your API key in the authorization header:
              </p>

              <pre className="p-4 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 overflow-x-auto space-y-1">
                <span className="text-muted-foreground">// Search YouTube videos</span><br/>
                <span className="text-emerald-400">const res = await fetch("https://YOUR-DOMAIN/api/v1/videos/search?q=Alexandria", &#123;</span><br/>
                <span className="text-emerald-400">  headers: &#123; "Authorization": "Bearer YOUR_MORX_API_KEY" &#125;</span><br/>
                <span className="text-emerald-400">&#125;);</span><br/>
                <span className="text-emerald-400">const &#123; data &#125; = await res.json();</span>
              </pre>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* EDIT CLIENT & PROVIDERS MODAL */}
      {/* ========================================================================= */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border/80 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Edit3 className="size-4 text-primary" /> Edit API Client: {editingClient.name}
              </h3>
              <button 
                onClick={() => setEditingClient(null)} 
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground font-medium block mb-1">Application Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/70 bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground font-medium block mb-1">Description</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/70 bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground font-medium block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-border/70 bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="active">Active (Keys can call API)</option>
                  <option value="suspended">Suspended (Temporarily disabled)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-[11px]">Allowed Providers / Services:</span>
                  <div className="flex gap-2 text-[10px] text-primary">
                    <button 
                      type="button" 
                      onClick={() => setEditServices(GATEWAY_SERVICES.map(s => s.id))}
                      className="hover:underline font-mono"
                    >
                      All
                    </button>
                    <span>·</span>
                    <button 
                      type="button" 
                      onClick={() => setEditServices([])}
                      className="hover:underline font-mono text-muted-foreground"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {GATEWAY_SERVICES.map((s) => {
                    const isChecked = editServices.includes(s.id);
                    const Icon = s.icon;
                    return (
                      <label 
                        key={s.id} 
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs ${
                          isChecked 
                            ? "bg-primary/10 border-primary/40 text-foreground font-medium" 
                            : "bg-background/60 border-border/60 text-muted-foreground"
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditServices([...editServices, s.id]);
                            } else {
                              setEditServices(editServices.filter(id => id !== s.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <Icon className={`size-3.5 ${s.color} shrink-0`} />
                        <span className="truncate">{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl border border-border/70 hover:bg-muted text-muted-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </ApiAccessGuard>

      <Footer />
    </div>
  );
}
