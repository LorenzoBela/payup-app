import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded-md" />
                    <div className="h-4 w-64 bg-muted rounded-md" />
                </div>
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-4">
                            <div className="h-4 w-20 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="h-8 w-16 bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content cards skeleton */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-4 sm:p-6">
                            <div className="h-5 w-32 bg-muted rounded-md" />
                            <div className="h-4 w-48 bg-muted rounded-md mt-1" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-10 w-full bg-muted rounded-md" />
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
