import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded-md" />
                    <div className="h-4 w-72 bg-muted rounded-md" />
                </div>
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>

            {/* Stats overview skeleton */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-20 bg-muted rounded-md" />
                                <div className="h-4 w-4 bg-muted rounded-md" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="h-8 w-16 bg-muted rounded-md mb-1" />
                            <div className="h-3 w-24 bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions & Recent Activity skeleton */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <div className="h-5 w-28 bg-muted rounded-md" />
                        <div className="h-4 w-44 bg-muted rounded-md mt-1" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 w-full bg-muted rounded-md" />
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <div className="h-5 w-32 bg-muted rounded-md" />
                            <div className="h-4 w-48 bg-muted rounded-md" />
                        </div>
                        <div className="h-8 w-20 bg-muted rounded-md" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-24 bg-muted rounded-md" />
                                        <div className="h-4 w-16 bg-muted rounded-md" />
                                    </div>
                                    <div className="h-4 w-full bg-muted rounded-md" />
                                    <div className="h-3 w-20 bg-muted rounded-md" />
                                </div>
                                <div className="h-4 w-16 bg-muted rounded-md" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
