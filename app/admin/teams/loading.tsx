import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminTeamsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-40 bg-muted rounded-md" />
                    <div className="h-4 w-56 bg-muted rounded-md" />
                </div>
                <div className="h-10 w-64 bg-muted rounded-md" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-4 pb-2">
                            <div className="h-4 w-20 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="h-8 w-12 bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Teams grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-muted rounded-md" />
                                <div className="space-y-1">
                                    <div className="h-5 w-32 bg-muted rounded-md" />
                                    <div className="h-3 w-20 bg-muted rounded-md" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 w-16 bg-muted rounded-md" />
                                <div className="h-4 w-8 bg-muted rounded-md" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-20 bg-muted rounded-md" />
                                <div className="h-4 w-16 bg-muted rounded-md" />
                            </div>
                            <div className="h-8 w-full bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
