"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    Gauge,
    Database,
    Server,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Clock,
    Activity,
    Users,
    Building2,
    Receipt,
    CreditCard,
    Wifi
} from "lucide-react";
import { getPerformanceMetrics } from "@/app/actions/admin";

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

export function MobileAdminPerformance() {
    const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPerformanceMetrics();
            setMetrics(data as ServerMetrics);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Failed to fetch metrics:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchMetrics, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchMetrics]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "connected":
            case "healthy":
                return "bg-green-500";
            case "slow":
            case "degraded":
                return "bg-yellow-500";
            default:
                return "bg-red-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "connected":
            case "healthy":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "slow":
            case "degraded":
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
        }
    };

    if (loading && !metrics) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-32 rounded-xl" />
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="text-center py-24 text-muted-foreground">
                Failed to load performance metrics
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                        <Gauge className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Performance</h1>
                        <p className="text-xs text-muted-foreground">System health</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={autoRefresh ? "default" : "outline"} className="text-xs">
                        {autoRefresh ? "Live" : "Paused"}
                    </Badge>
                    <Button variant="outline" size="icon" onClick={fetchMetrics}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Updated: {lastRefresh.toLocaleTimeString()}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                >
                    {autoRefresh ? "Pause" : "Resume"}
                </Button>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium">Database</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics.database.status)} animate-pulse`} />
                            {getStatusIcon(metrics.database.status)}
                            <span className="text-sm font-medium capitalize">{metrics.database.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.database.responseTime}ms response
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Server className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium">API</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics.api.status)} animate-pulse`} />
                            {getStatusIcon(metrics.api.status)}
                            <span className="text-sm font-medium capitalize">{metrics.api.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Server OK
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Real-Time Activity */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Real-Time Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-2xl font-bold text-blue-500">
                                {metrics.recentActivity.last5Minutes}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Last 5m</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-2xl font-bold text-purple-500">
                                {metrics.recentActivity.last15Minutes}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Last 15m</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <p className="text-2xl font-bold text-orange-500">
                                {metrics.recentActivity.lastHour}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Last hour</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div>
                            <p className="text-lg font-bold">{metrics.system.totalUsers}</p>
                            <p className="text-xs text-muted-foreground">Users</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-lg font-bold">{metrics.system.totalTeams}</p>
                            <p className="text-xs text-muted-foreground">Teams</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Receipt className="w-5 h-5 text-purple-500" />
                        <div>
                            <p className="text-lg font-bold">{metrics.system.totalExpenses}</p>
                            <p className="text-xs text-muted-foreground">Expenses</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-lg font-bold">{metrics.system.totalSettlements}</p>
                            <p className="text-xs text-muted-foreground">Settlements</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Activity */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Today's Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{metrics.system.activitiesToday}</p>
                            <p className="text-xs text-muted-foreground">Actions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{metrics.system.expensesToday}</p>
                            <p className="text-xs text-muted-foreground">Expenses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{metrics.system.settlementsToday}</p>
                            <p className="text-xs text-muted-foreground">Payments</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Items */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Pending Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{metrics.system.pendingSettlements}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Clock className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{metrics.system.unconfirmedSettlements}</p>
                                <p className="text-xs text-muted-foreground">Unconfirmed</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Health Summary */}
            {metrics.database.status === "connected" && metrics.database.responseTime < 100 && (
                <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                    <CardContent className="p-4 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm text-green-800 dark:text-green-200">
                                System Running Optimally
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                                Database response: {metrics.database.responseTime}ms
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
