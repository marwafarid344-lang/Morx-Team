'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Users2, 
  Briefcase, 
  CheckCircle2, 
  MessageSquare, 
  Lock, 
  ArrowRight, 
  ShieldCheck,
  Activity,
  Calendar,
  Search,
  Database,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface Stats {
  users: number;
  teams: number;
  projects: number;
  tasks: number;
  comments: number;
}

interface RecentData {
  users: any[];
  teams: any[];
  tasks: any[];
}

interface ChartData {
  statusDistribution: any[];
  projectProgress: any[];
  growthData: any[];
}

export default function AnalyticsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{ stats: Stats; recentData: RecentData; chartData: ChartData } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        setData(result.data);
        toast.success('Access granted');
      } else {
        toast.error(result.error || 'Incorrect password');
      }
    } catch (error) {
      toast.error('Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Secure Analytics</h1>
            <p className="text-muted-foreground">Access is restricted to authorized personnel only.</p>
          </div>

          <Card className="border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <CardDescription>Enter the security key to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="Security Key" 
                      className="pl-10 h-12 bg-background/50 border-border/40"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 gap-2 text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Access Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Database className="w-3 h-3" />
              Live Database Overview
            </div>
            <h1 className="text-4xl font-bold tracking-tight">System Analytics</h1>
            <p className="text-muted-foreground max-w-xl text-lg">
              Comprehensive data metrics and activity tracking for the MorxCorp ecosystem.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="p-4 bg-card/50 border border-border/40 backdrop-blur-md rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-xl">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">System Status</p>
                    <p className="text-sm font-semibold text-green-500">All Systems Operational</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Total Users" value={data?.stats.users || 0} icon={Users} color="border-l-blue-500" description="Registered user accounts" />
          <StatCard title="Total Teams" value={data?.stats.teams || 0} icon={Users2} color="border-l-purple-500" description="Collaborative workspace teams" />
          <StatCard title="Active Projects" value={data?.stats.projects || 0} icon={Briefcase} color="border-l-emerald-500" description="Team-based student projects" />
          <StatCard title="Total Tasks" value={data?.stats.tasks || 0} icon={CheckCircle2} color="border-l-orange-500" description="Tasks across all projects" />
          <StatCard title="Discussion" value={data?.stats.comments || 0} icon={MessageSquare} color="border-l-pink-500" description="Comments and interactions" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Growth Chart */}
          <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  User Growth
                </CardTitle>
                <CardDescription>Daily registrations over the last 7 days</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData.growthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Distribution */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-500" />
                Task Status
              </CardTitle>
              <CardDescription>Ecosystem task distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.chartData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.chartData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36}/>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Lists and Project Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Project Progress */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border/40 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Top Projects
                </CardTitle>
                <CardDescription>Completion rate by project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {data?.chartData.projectProgress.map((project, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate max-w-[150px]">{project.name}</span>
                      <span className="text-muted-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{project.tasks} total tasks</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur-md p-6">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">System Health</h3>
                    <p className="text-xs text-muted-foreground">Optimal performance detected</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                     <span className="text-xs text-muted-foreground">Latency</span>
                     <span className="text-xs font-bold text-emerald-500">24ms</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                     <span className="text-xs text-muted-foreground">Error Rate</span>
                     <span className="text-xs font-bold text-emerald-500">0.02%</span>
                  </div>
               </div>
            </Card>
          </div>

          {/* Activity Tables */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-border/40 bg-card/50 backdrop-blur-md overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Activity Burst</CardTitle>
                  <CardDescription>Latest users and system entries</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Identity</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Action/Context</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {data?.recentData.users.map((user, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                                 {user.first_name[0]}{user.last_name[0]}
                               </div>
                               <span className="font-medium">{user.first_name} {user.last_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground italic text-sm">Joined Platform</td>
                          <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {data?.recentData.tasks.map((task, idx) => (
                        <tr key={`task-${idx}`} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                 <CheckCircle2 className="w-4 h-4" />
                               </div>
                               <span className="font-medium truncate max-w-[200px]">{task.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full text-[10px] ${task.status === 2 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                               {task.status === 2 ? 'Completed' : 'Active'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                            {new Date(task.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Lock Info */}
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
           <Button variant="ghost" className="gap-2 mb-4" onClick={() => setIsAuthenticated(false)}>
              <Lock className="w-4 h-4" />
              Secure Lock Session
           </Button>
           <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Admin Terminal - MorxCorp Authorization Required</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, description }: any) {
  return (
    <Card className={`border-l-4 ${color} bg-card/50 backdrop-blur-md relative overflow-hidden group hover:bg-card/80 transition-all`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <Activity className="w-3 h-3 text-muted-foreground opacity-20" />
        </div>
        <CardTitle className="text-4xl font-bold tracking-tight">{value}</CardTitle>
        <CardDescription className="font-semibold text-foreground/80">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-nowrap">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function Tooltip({ active, payload, label, contentStyle }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 rounded-2xl shadow-2xl" style={contentStyle}>
        <p className="text-xs font-bold mb-1">{label}</p>
        <p className="text-lg font-black text-primary">
          {payload[0].value} <span className="text-[10px] text-muted-foreground">registrations</span>
        </p>
      </div>
    );
  }
  return null;
}
