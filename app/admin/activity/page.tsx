"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllActivityLogs } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityLog {
    id: string;
    action: string;
    details: string;
    createdAt: Date;
    teamName: string;
    teamCode: string;
    userName: string;
    userEmail: string;
}

const actionColors: Record<string, string> = {
    ADDED_EXPENSE: "bg-green-500/10 text-green-600",
    DELETED_EXPENSE: "bg-red-500/10 text-red-600",
    PAID_SETTLEMENT: "bg-blue-500/10 text-blue-600",
    SUBMITTED_PAYMENT: "bg-yellow-500/10 text-yellow-600",
    VERIFIED_PAYMENT: "bg-emerald-500/10 text-emerald-600",
    REJECTED_PAYMENT: "bg-orange-500/10 text-orange-600",
    PAID_SETTLEMENT_BATCH: "bg-indigo-500/10 text-indigo-600",
    SUBMITTED_PAYMENT_BATCH: "bg-purple-500/10 text-purple-600",
};

export default function AdminActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllActivityLogs({
                page,
                limit: 30,
            });
            setLogs(result.logs as ActivityLog[]);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionColor = (action: string) => {
        return actionColors[action] || "bg-gray-500/10 text-gray-600";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
                <p className="text-muted-foreground">
                    System-wide activity feed across all teams.
                </p>
            </div>

            {/* Activity Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        All Activity
                    </CardTitle>
                    <CardDescription>
                        {total} total log entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length > 0 ? (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    <Badge className={getActionColor(log.action)}>
                                                        {log.action.replace(/_/g, " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm max-w-[150px] sm:max-w-[300px] truncate">
                                                        {log.details}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm font-medium">{log.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm">{log.teamName}</p>
                                                        <code className="text-xs text-muted-foreground">{log.teamCode}</code>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm">
                                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1">Previous</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        <span className="hidden sm:inline mr-1">Next</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-12">
                            No activity logs found
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

