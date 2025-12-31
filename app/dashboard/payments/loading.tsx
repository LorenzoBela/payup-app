import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PaymentsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted rounded-md" />
                    <div className="h-4 w-56 bg-muted rounded-md" />
                </div>
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-muted rounded-md" />
                <div className="h-10 w-24 bg-muted rounded-md" />
                <div className="h-10 w-24 bg-muted rounded-md" />
            </div>

            {/* Content */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-muted rounded-full" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded-md" />
                                    <div className="h-3 w-24 bg-muted rounded-md" />
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="h-5 w-20 bg-muted rounded-md" />
                                <div className="h-3 w-16 bg-muted rounded-md" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
