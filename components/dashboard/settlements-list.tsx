"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { markSettlementAsPaid } from "@/app/actions/expenses";
import { useTeamSettlements } from "@/lib/hooks/use-dashboard-data";
import { toast } from "sonner";

interface SettlementsListProps {
  teamId: string;
  refreshKey?: number;
}

export function SettlementsList({ teamId, refreshKey }: SettlementsListProps) {
  const [markingId, setMarkingId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { 
    settlements, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMore, 
    mutate 
  } = useTeamSettlements(teamId);

  // Re-fetch when refreshKey changes
  useEffect(() => {
    if (refreshKey) {
      mutate();
    }
  }, [refreshKey, mutate]);

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

  const handleMarkAsPaid = async (settlementId: string) => {
    setMarkingId(settlementId);
    try {
      const result = await markSettlementAsPaid(settlementId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Marked as paid!");
        mutate(); // Revalidate cache
      }
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setMarkingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlements</CardTitle>
          <CardDescription>Who owes whom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlements</CardTitle>
        <CardDescription>Who owes whom</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {settlements.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">All settled up!</p>
            <p className="text-sm text-muted-foreground mt-1">No pending payments</p>
          </div>
        ) : (
          <>
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className="p-4 border border-border rounded-lg space-y-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {settlement.isCurrentUserOwing ? (
                        <>
                          You owe <span className="text-primary font-semibold">{settlement.owed_to}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-primary font-semibold">{settlement.owed_by}</span> owes you
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {settlement.expense_description}
                    </p>
                  </div>
                  <Badge
                    variant={settlement.status === "paid" ? "default" : "secondary"}
                    className={
                      settlement.status === "paid"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }
                  >
                    {settlement.status === "paid" ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {settlement.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    ₱{settlement.amount.toFixed(2)}
                  </span>
                  {settlement.status === "pending" && settlement.isCurrentUserOwing && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(settlement.id)}
                      disabled={markingId === settlement.id}
                    >
                      {markingId === settlement.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Marking...
                        </>
                      ) : (
                        "Mark as Paid"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-2 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
              {!hasMore && settlements.length > 0 && (
                <p className="text-xs text-muted-foreground">All settlements loaded</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
