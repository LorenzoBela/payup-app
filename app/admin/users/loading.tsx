import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminUsersLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-40 bg-muted rounded-md" />
                    <div className="h-4 w-64 bg-muted rounded-md" />
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-64 bg-muted rounded-md" />
                    <div className="h-10 w-24 bg-muted rounded-md" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-4 pb-2">
                            <div className="h-4 w-16 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="h-8 w-12 bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table skeleton */}
            <Card>
                <CardContent className="p-0">
                    <div className="border-b p-4 flex gap-4">
                        <div className="h-4 w-8 bg-muted rounded-md" />
                        <div className="h-4 w-32 bg-muted rounded-md" />
                        <div className="h-4 w-40 bg-muted rounded-md flex-1" />
                        <div className="h-4 w-20 bg-muted rounded-md" />
                        <div className="h-4 w-24 bg-muted rounded-md" />
                    </div>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="border-b p-4 flex items-center gap-4">
                            <div className="h-4 w-8 bg-muted rounded-md" />
                            <div className="h-8 w-8 bg-muted rounded-full" />
                            <div className="flex-1 space-y-1">
                                <div className="h-4 w-32 bg-muted rounded-md" />
                                <div className="h-3 w-48 bg-muted rounded-md" />
                            </div>
                            <div className="h-6 w-16 bg-muted rounded-full" />
                            <div className="h-4 w-24 bg-muted rounded-md" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
