"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getTeamLogs } from "@/app/actions/logs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, History } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Log {
    id: string;
    action: string;
    details: string;
    created_at: Date;
    user_name: string;
    user_email: string;
}

export default function LogsPage() {
    const { selectedTeam } = useTeam();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedTeam) {
            setLoading(true);
            getTeamLogs(selectedTeam.id).then((data) => {
                setLogs(data);
                setLoading(false);
            });
        }
    }, [selectedTeam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                    <div className="space-y-6">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No activity logs found for this team.
                            </div>
                        ) : (
                            logs.map((log) => (
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
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
