"use client";

import { useRef, useEffect, useCallback } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { useTeamLogs } from "@/lib/hooks/use-dashboard-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, History } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function LogsPage() {
    const { selectedTeam, isLoading: teamLoading } = useTeam();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const { 
        logs, 
        isLoading, 
        isLoadingMore, 
        hasMore, 
        loadMore 
    } = useTeamLogs(selectedTeam?.id || null);

    // Infinite scroll observer
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
        }
    }, [hasMore, isLoadingMore, loadMore]);

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            threshold: 0.1,
            rootMargin: '100px',
        });
        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    if (teamLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <History className="w-12 h-12 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">No Team Selected</h2>
                <p className="text-muted-foreground">Select a team to view activity logs.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <History className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Activity Logs</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {logs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No activity logs found for this team.
                                </div>
                            ) : (
                                <>
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback>
                                                    {log.user_name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm leading-none">{log.details}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-semibold">{log.user_name}</span>
                                                    <span>•</span>
                                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Infinite scroll trigger */}
                                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                                        {isLoadingMore && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Loading more...</span>
                                            </div>
                                        )}
                                        {!hasMore && logs.length > 0 && (
                                            <p className="text-sm text-muted-foreground">All activity loaded</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
