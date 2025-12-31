import { Card, CardContent } from "@/components/ui/card";

export default function ExpensesLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted rounded-md" />
                    <div className="h-4 w-48 bg-muted rounded-md" />
                </div>
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>

            {/* Expenses list */}
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-muted rounded-md" />
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-muted rounded-md" />
                                    <div className="h-3 w-28 bg-muted rounded-md" />
                                </div>
                            </div>
                            <div className="h-6 w-20 bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
