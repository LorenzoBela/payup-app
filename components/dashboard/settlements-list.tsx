"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { getTeamSettlements, markSettlementAsPaid } from "@/app/actions/expenses";
import { toast } from "sonner";

interface SettlementsListProps {
  teamId: string;
  refreshKey?: number;
}

interface Settlement {
  id: string;
  expense_description: string;
  owed_by: string;
  owed_to: string;
  amount: number;
  status: string;
  isCurrentUserOwing: boolean;
  isCurrentUserOwed: boolean;
}

export function SettlementsList({ teamId, refreshKey }: SettlementsListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const data = await getTeamSettlements(teamId);
      setSettlements(data as Settlement[]);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
      toast.error("Failed to load settlements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchSettlements();
    }
  }, [teamId, refreshKey]);

  const handleMarkAsPaid = async (settlementId: string) => {
    setMarkingId(settlementId);
    try {
      const result = await markSettlementAsPaid(settlementId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Marked as paid!");
        fetchSettlements();
      }
    } catch (error) {
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
              <Skeleton className="h-16 w-full" />
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
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">All settled up!</p>
          </div>
        ) : (
          settlements.map((settlement) => (
            <div
              key={settlement.id}
              className="p-4 border border-border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {settlement.isCurrentUserOwing ? (
                      <>
                        You owe <span className="text-primary">{settlement.owed_to}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-primary">{settlement.owed_by}</span> owes you
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {settlement.expense_description}
                  </p>
                </div>
                <Badge
                  variant={settlement.status === "paid" ? "default" : "secondary"}
                  className={
                    settlement.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
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
                    {markingId === settlement.id ? "Marking..." : "Mark as Paid"}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


