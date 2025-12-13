"use client";

import { useEffect, useState, useCallback } from "react";
import { getPerformanceMetrics } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Gauge,
    Database,
    Server,
    Zap,
    Clock,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Globe,
    HardDrive,
    Activity,
    TrendingUp,
    Wifi,
    Users,
    Building2,
    Receipt,
    CreditCard
} from "lucide-react";

interface ServerMetrics {
    database: {
        status: "connected" | "slow" | "disconnected";
        responseTime: number;
        queryCount: number;
        activeQueries: number;
    };
    api: {
        status: "healthy" | "degraded" | "down";
        serverTime: Date;
    };
    system: {
        totalUsers: number;
        totalTeams: number;
        totalExpenses: number;
        totalSettlements: number;
        pendingSettlements: number;
        unconfirmedSettlements: number;
        activitiesToday: number;
        expensesToday: number;
        settlementsToday: number;
    };
    recentActivity: {
        last5Minutes: number;
        last15Minutes: number;
        lastHour: number;
    };
}

interface ClientMetrics {
    pageLoadTime: number;
    timeToFirstByte: number;
    domContentLoaded: number;
    jsHeapUsed: number;
    jsHeapTotal: number;
    networkLatency: number;
    connectionType: string;
}

function StatusIndicator({ status }: { status: "connected" | "slow" | "disconnected" | "healthy" | "degraded" | "down" }) {
    const config = {
        connected: { color: "bg-green-500", icon: CheckCircle, label: "Connected" },
        healthy: { color: "bg-green-500", icon: CheckCircle, label: "Healthy" },
        slow: { color: "bg-yellow-500", icon: AlertTriangle, label: "Slow" },
        degraded: { color: "bg-yellow-500", icon: AlertTriangle, label: "Degraded" },
        disconnected: { color: "bg-red-500", icon: XCircle, label: "Disconnected" },
        down: { color: "bg-red-500", icon: XCircle, label: "Down" },
    };

    const { color, icon: Icon, label } = config[status];

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
            <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

function MetricCard({
    title,
    value,
    unit,
    icon: Icon,
    description,
    status
}: {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    status?: "good" | "warning" | "critical";
}) {
    const statusColors = {
        good: "text-green-500",
        warning: "text-yellow-500",
        critical: "text-red-500",
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${status ? statusColors[status] : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{value}</span>
                    {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPerformancePage() {
    const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
    const [clientMetrics, setClientMetrics] = useState<ClientMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10); // seconds

    const measureClientPerformance = useCallback(() => {
        // Page Performance metrics from browser
        const perfEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        const navTiming = perfEntries[0];

        let pageLoadTime = 0;
        let timeToFirstByte = 0;
        let domContentLoaded = 0;

        if (navTiming) {
            pageLoadTime = Math.round(navTiming.loadEventEnd - navTiming.startTime);
            timeToFirstByte = Math.round(navTiming.responseStart - navTiming.requestStart);
            domContentLoaded = Math.round(navTiming.domContentLoadedEventEnd - navTiming.startTime);
        }

        // Memory metrics (Chrome only)
        let jsHeapUsed = 0;
        let jsHeapTotal = 0;

        if ('memory' in performance) {
            const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
            jsHeapUsed = Math.round(memory.usedJSHeapSize / (1024 * 1024));
            jsHeapTotal = Math.round(memory.totalJSHeapSize / (1024 * 1024));
        }

        // Network info
        let networkLatency = 0;
        let connectionType = "Unknown";

        if ('connection' in navigator) {
            const connection = navigator.connection as { effectiveType?: string; rtt?: number };
            connectionType = connection.effectiveType || "Unknown";
            networkLatency = connection.rtt || 0;
        }

        setClientMetrics({
            pageLoadTime,
            timeToFirstByte,
            domContentLoaded,
            jsHeapUsed,
            jsHeapTotal,
            networkLatency,
            connectionType,
        });
    }, []);

    const fetchServerMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const metrics = await getPerformanceMetrics();
            setServerMetrics(metrics as ServerMetrics);
            measureClientPerformance();
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Failed to fetch metrics:", error);
        } finally {
            setLoading(false);
        }
    }, [measureClientPerformance]);

    useEffect(() => {
        fetchServerMetrics();
    }, [fetchServerMetrics]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchServerMetrics, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchServerMetrics]);

    const getResponseTimeStatus = (time: number): "good" | "warning" | "critical" => {
        if (time < 100) return "good";
        if (time < 500) return "warning";
        return "critical";
    };

    const getMemoryStatus = (used: number, total: number): "good" | "warning" | "critical" => {
        if (total === 0) return "good";
        const percentage = (used / total) * 100;
        if (percentage < 70) return "good";
        if (percentage < 90) return "warning";
        return "critical";
    };

    if (!serverMetrics) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
                    <p className="text-muted-foreground">
                        Real-time system health and performance monitoring
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={autoRefresh ? "default" : "outline"} className="gap-1">
                        <Activity className="h-3 w-3" />
                        {autoRefresh ? `Live (${refreshInterval}s)` : "Paused"}
                    </Badge>
                    <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="text-sm border rounded px-2 py-1 bg-background"
                    >
                        <option value={5}>5s</option>
                        <option value={10}>10s</option>
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                    </select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? "Pause" : "Resume"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchServerMetrics}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last updated: {lastRefresh.toLocaleTimeString()}
                <span className="text-xs">({Math.round((Date.now() - lastRefresh.getTime()) / 1000)}s ago)</span>
            </div>

            {/* System Status Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Database Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusIndicator status={serverMetrics.database.status} />
                        <div className="mt-3 space-y-1">
                            <p className="text-xs text-muted-foreground">
                                Response time: <span className="font-medium text-foreground">{serverMetrics.database.responseTime}ms</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Queries executed: <span className="font-medium text-foreground">{serverMetrics.database.queryCount}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            API Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusIndicator status={serverMetrics.api.status} />
                        <p className="text-xs text-muted-foreground mt-3">
                            Server time: <span className="font-medium text-foreground">
                                {new Date(serverMetrics.api.serverTime).toLocaleTimeString()}
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Network Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="font-medium">
                                {clientMetrics?.connectionType || "Unknown"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            RTT Latency: <span className="font-medium text-foreground">
                                {clientMetrics?.networkLatency || 0}ms
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Real-Time Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Real-Time Activity
                    </CardTitle>
                    <CardDescription>
                        User activity across the platform (updated live)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-3xl font-bold text-blue-500">
                                {serverMetrics.recentActivity.last5Minutes}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Last 5 minutes</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-3xl font-bold text-purple-500">
                                {serverMetrics.recentActivity.last15Minutes}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Last 15 minutes</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <p className="text-3xl font-bold text-orange-500">
                                {serverMetrics.recentActivity.lastHour}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Last hour</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Users"
                    value={serverMetrics.system.totalUsers}
                    icon={Users}
                    description="Active registered users"
                />
                <MetricCard
                    title="Total Teams"
                    value={serverMetrics.system.totalTeams}
                    icon={Building2}
                    description="Created teams"
                />
                <MetricCard
                    title="Total Expenses"
                    value={serverMetrics.system.totalExpenses}
                    icon={Receipt}
                    description="All recorded expenses"
                />
                <MetricCard
                    title="Total Settlements"
                    value={serverMetrics.system.totalSettlements}
                    icon={CreditCard}
                    description="Payment records"
                />
            </div>

            {/* Today's Activity */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{serverMetrics.system.activitiesToday}</div>
                        <p className="text-xs text-muted-foreground">Actions logged today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{serverMetrics.system.expensesToday}</div>
                        <p className="text-xs text-muted-foreground">New expenses today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Settlements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{serverMetrics.system.settlementsToday}</div>
                        <p className="text-xs text-muted-foreground">Payments today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Settlement Status
                    </CardTitle>
                    <CardDescription>
                        Current pending and unconfirmed payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-yellow-500/10">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{serverMetrics.system.pendingSettlements}</p>
                                <p className="text-sm text-muted-foreground">Pending Settlements</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-orange-500/10">
                                <Clock className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{serverMetrics.system.unconfirmedSettlements}</p>
                                <p className="text-sm text-muted-foreground">Awaiting Confirmation</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Client Performance */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="DB Response Time"
                    value={serverMetrics.database.responseTime}
                    unit="ms"
                    icon={Database}
                    description="Database query latency"
                    status={getResponseTimeStatus(serverMetrics.database.responseTime)}
                />
                <MetricCard
                    title="Page Load Time"
                    value={clientMetrics?.pageLoadTime || 0}
                    unit="ms"
                    icon={Gauge}
                    description="Total page load"
                    status={getResponseTimeStatus(clientMetrics?.pageLoadTime || 0)}
                />
                <MetricCard
                    title="Time to First Byte"
                    value={clientMetrics?.timeToFirstByte || 0}
                    unit="ms"
                    icon={Zap}
                    description="Server response start"
                    status={getResponseTimeStatus(clientMetrics?.timeToFirstByte || 0)}
                />
                <MetricCard
                    title="Network RTT"
                    value={clientMetrics?.networkLatency || 0}
                    unit="ms"
                    icon={Wifi}
                    description={`Connection: ${clientMetrics?.connectionType || "Unknown"}`}
                />
            </div>

            {/* Memory Usage (if available) */}
            {clientMetrics && clientMetrics.jsHeapTotal > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Browser Memory Usage
                        </CardTitle>
                        <CardDescription>
                            JavaScript heap memory (Chrome only)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">JS Heap Used</span>
                            <span className="font-medium">{clientMetrics.jsHeapUsed} MB / {clientMetrics.jsHeapTotal} MB</span>
                        </div>
                        <Progress
                            value={(clientMetrics.jsHeapUsed / clientMetrics.jsHeapTotal) * 100}
                            className="h-3"
                        />
                        <div className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${getMemoryStatus(clientMetrics.jsHeapUsed, clientMetrics.jsHeapTotal) === "good"
                                ? "bg-green-500"
                                : getMemoryStatus(clientMetrics.jsHeapUsed, clientMetrics.jsHeapTotal) === "warning"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`} />
                            <span className="text-muted-foreground">
                                {Math.round((clientMetrics.jsHeapUsed / clientMetrics.jsHeapTotal) * 100)}% utilization
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        System Health Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {serverMetrics.database.status === "connected" && serverMetrics.database.responseTime < 100 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Database Performing Optimally</p>
                                    <p className="text-xs text-muted-foreground">
                                        Response time of {serverMetrics.database.responseTime}ms is excellent.
                                    </p>
                                </div>
                            </div>
                        )}
                        {serverMetrics.database.status === "slow" && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Database Response Time Elevated</p>
                                    <p className="text-xs text-muted-foreground">
                                        Current response time is {serverMetrics.database.responseTime}ms. Consider optimizing queries.
                                    </p>
                                </div>
                            </div>
                        )}
                        {serverMetrics.recentActivity.last5Minutes > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10">
                                <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Active Users Detected</p>
                                    <p className="text-xs text-muted-foreground">
                                        {serverMetrics.recentActivity.last5Minutes} activities in the last 5 minutes.
                                    </p>
                                </div>
                            </div>
                        )}
                        {serverMetrics.system.pendingSettlements > 10 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">High Pending Settlements</p>
                                    <p className="text-xs text-muted-foreground">
                                        {serverMetrics.system.pendingSettlements} settlements are awaiting payment.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
