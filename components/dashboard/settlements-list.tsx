"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, ChevronRight, ArrowRight, Circle, Clock } from "lucide-react";
import { useEffect, useMemo, memo } from "react";
import { useTeamSettlements } from "@/lib/hooks/use-dashboard-data";
import Link from "next/link";

interface DebtRelationship {
  fromPerson: string;
  toPerson: string;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  unconfirmedCount: number;
  items: Array<{
    description: string;
    amount: number;
    status: string;
  }>;
}

// Get initials from name
const getInitials = (name: string) => {
  if (name === "You") return "ME";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Debt row showing Person A → Person B with status breakdown
const DebtRow = memo(function DebtRow({ debt }: { debt: DebtRelationship }) {
  const totalCount = debt.paidCount + debt.pendingCount + debt.unconfirmedCount;
  const isPaid = debt.pendingCount === 0 && debt.unconfirmedCount === 0;

  return (
    <div className={`p-3 rounded-lg border transition-colors ${isPaid ? 'bg-muted/30 border-border/50' : 'bg-background border-border hover:border-foreground/20'}`}>
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* From person */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Avatar className="h-8 w-8 flex-shrink-0 border border-border">
            <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
              {getInitials(debt.fromPerson)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{debt.fromPerson}</span>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        {/* To person */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span className="text-sm font-medium truncate text-right">{debt.toPerson}</span>
          <Avatar className="h-8 w-8 flex-shrink-0 border border-border">
            <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
              {getInitials(debt.toPerson)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Amount */}
        <div className="text-right min-w-[75px] flex-shrink-0">
          <span className={`text-sm font-bold ${isPaid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            ₱{debt.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status bullets */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground pl-10">
        {debt.pendingCount > 0 && (
          <span className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-current" />
            {debt.pendingCount} pending
          </span>
        )}
        {debt.unconfirmedCount > 0 && (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
            <Clock className="w-3 h-3" />
            {debt.unconfirmedCount} awaiting
          </span>
        )}
        {debt.paidCount > 0 && (
          <span className="flex items-center gap-1 text-foreground/60">
            <CheckCircle className="w-3 h-3" />
            {debt.paidCount} paid
          </span>
        )}
      </div>

      {/* Top expense preview */}
      {debt.items.length > 0 && !isPaid && (
        <div className="mt-2 pl-10 text-xs text-muted-foreground truncate">
          • {debt.items[0].description}
          {debt.items.length > 1 && ` +${debt.items.length - 1} more`}
        </div>
      )}
    </div>
  );
});

interface SettlementsListProps {
  teamId: string;
  refreshKey?: number;
}

export function SettlementsList({ teamId, refreshKey }: SettlementsListProps) {
  const {
    settlements,
    isLoading,
    mutate
  } = useTeamSettlements(teamId);

  useEffect(() => {
    if (refreshKey) {
      mutate();
    }
  }, [refreshKey, mutate]);

  // Group by person pairs with status breakdown
  const { debtRelationships, stats } = useMemo(() => {
    const relationshipMap = new Map<string, DebtRelationship>();
    let totalPending = 0;
    let totalPaid = 0;
    let totalUnconfirmed = 0;

    settlements.forEach((s) => {
      const key = `${s.owed_by}|${s.owed_to}`;
      const existing = relationshipMap.get(key);

      if (existing) {
        existing.totalAmount += s.amount;
        if (s.status === 'paid') existing.paidCount += 1;
        else if (s.status === 'unconfirmed') existing.unconfirmedCount += 1;
        else existing.pendingCount += 1;
        existing.items.push({
          description: s.expense_description,
          amount: s.amount,
          status: s.status
        });
      } else {
        relationshipMap.set(key, {
          fromPerson: s.owed_by,
          toPerson: s.owed_to,
          totalAmount: s.amount,
          paidCount: s.status === 'paid' ? 1 : 0,
          pendingCount: s.status === 'pending' ? 1 : 0,
          unconfirmedCount: s.status === 'unconfirmed' ? 1 : 0,
          items: [{
            description: s.expense_description,
            amount: s.amount,
            status: s.status
          }]
        });
      }

      if (s.status === 'paid') totalPaid += 1;
      else if (s.status === 'unconfirmed') totalUnconfirmed += 1;
      else totalPending += 1;
    });

    // Sort by pending first, then by amount
    const relationships = Array.from(relationshipMap.values())
      .sort((a, b) => {
        // Active (has pending/unconfirmed) first
        const aActive = a.pendingCount + a.unconfirmedCount;
        const bActive = b.pendingCount + b.unconfirmedCount;
        if (aActive > 0 && bActive === 0) return -1;
        if (bActive > 0 && aActive === 0) return 1;
        return b.totalAmount - a.totalAmount;
      });

    return {
      debtRelationships: relationships,
      stats: { totalPending, totalPaid, totalUnconfirmed, total: totalPending + totalPaid + totalUnconfirmed }
    };
  }, [settlements]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settlements</CardTitle>
          <CardDescription>Who owes whom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasSettlements = debtRelationships.length > 0;
  const activeRelationships = debtRelationships.filter(d => d.pendingCount > 0 || d.unconfirmedCount > 0);

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Settlements</CardTitle>
            <CardDescription>Who owes whom</CardDescription>
          </div>
          {hasSettlements && (
            <Link href="/dashboard/payments">
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                Details <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {!hasSettlements ? (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
            <p className="font-medium">All Settled</p>
            <p className="text-sm text-muted-foreground mt-1">No pending payments</p>
          </div>
        ) : (
          <>
            {/* Quick stats bar */}
            <div className="flex items-center justify-between text-xs border-b pb-3 mb-1">
              <span className="text-muted-foreground">{debtRelationships.length} relationships</span>
              <div className="flex items-center gap-3">
                {stats.totalPending > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                    {stats.totalPending} pending
                  </Badge>
                )}
                {stats.totalUnconfirmed > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400">
                    {stats.totalUnconfirmed} awaiting
                  </Badge>
                )}
                {stats.totalPaid > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground">
                    {stats.totalPaid} paid
                  </Badge>
                )}
              </div>
            </div>

            {/* Debt Relationships - show active ones first, limit to 4 */}
            <div className="space-y-2">
              {debtRelationships.slice(0, 4).map((debt) => (
                <DebtRow key={`${debt.fromPerson}-${debt.toPerson}`} debt={debt} />
              ))}
            </div>

            {debtRelationships.length > 4 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{debtRelationships.length - 4} more
              </p>
            )}

            {/* CTA */}
            <Link href="/dashboard/payments" className="block pt-2">
              <Button variant="outline" className="w-full">
                Manage Payments
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
