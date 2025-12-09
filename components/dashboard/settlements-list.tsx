"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface SettlementsListProps {
  userId: string;
}

export function SettlementsList({ userId }: SettlementsListProps) {
  // TODO: Fetch real data from API
  const settlements = [
    {
      id: "1",
      expense_description: "Team lunch meeting",
      owed_by: "You",
      owed_to: "Jane Smith",
      amount: 27.42,
      status: "pending" as const,
    },
    {
      id: "2",
      expense_description: "Office supplies",
      owed_by: "John Smith",
      owed_to: "You",
      amount: 10.67,
      status: "pending" as const,
    },
    {
      id: "3",
      expense_description: "Printing thesis drafts",
      owed_by: "You",
      owed_to: "John Doe",
      amount: 15.17,
      status: "paid" as const,
    },
  ];

  const handleMarkAsPaid = async (settlementId: string) => {
    // TODO: Implement API call
    console.log("Mark as paid:", settlementId);
  };

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
                    {settlement.owed_by === "You" ? (
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
                  ${settlement.amount.toFixed(2)}
                </span>
                {settlement.status === "pending" && settlement.owed_by === "You" && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkAsPaid(settlement.id)}
                  >
                    Mark as Paid
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

