"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Trash2, Search, Loader2, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import { useTeamExpenses } from "@/lib/hooks/use-dashboard-data";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";

// Threshold for enabling virtual scrolling
const VIRTUALIZATION_THRESHOLD = 50;

// Memoized expense item component for better performance
interface ExpenseItemProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    category: string;
    paid_by_name: string;
    created_at: Date;
    // Monthly payment fields
    is_monthly: boolean;
    month_number: number | null;
    total_months: number | null;
    deadline: Date | null;
    deadline_day: number | null;
  };
  isDeleting: boolean;
  onDelete: (id: string) => void;
  getCategoryColor: (category: string) => string;
}

const ExpenseItem = memo(function ExpenseItem({
  expense,
  isDeleting,
  onDelete,
  getCategoryColor
}: ExpenseItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{expense.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className={getCategoryColor(expense.category)}>
              {expense.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Paid by {expense.paid_by_name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">
            ₱{expense.amount.toFixed(2)}
          </p>
          {expense.is_monthly && expense.deadline ? (
            <div className="flex items-center justify-end gap-1 text-xs text-orange-600 dark:text-orange-400">
              <Clock className="w-3 h-3" />
              <span>
                Due: {new Date(expense.deadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {new Date(expense.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(expense.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-destructive" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

interface ExpenseListProps {
  teamId: string;
  refreshKey?: number;
}

export function ExpenseList({ teamId, refreshKey }: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    expenses,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    mutate
  } = useTeamExpenses(teamId);

  // Re-fetch when refreshKey changes (after adding new expense)
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

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);

    // Store current data for rollback
    const previousExpenses = expenses;

    // Optimistic update - immediately remove from UI
    mutate(
      (current) => {
        if (!current) return current;
        return current.map(page => ({
          ...page,
          expenses: page.expenses.filter((e: { id: string }) => e.id !== expenseId)
        }));
      },
      { revalidate: false }
    );

    try {
      const result = await deleteExpense(expenseId);
      if (result.error) {
        // Rollback on error
        mutate();
        toast.error(result.error);
      } else {
        toast.success("Expense deleted");
        // Revalidate to ensure consistency
        mutate();
      }
    } catch {
      // Rollback on exception
      mutate();
      toast.error("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      printing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      supplies: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      transportation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[category.toLowerCase()] || colors.other;
  };

  // Client-side filtering (instant, no API call)
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.paid_by_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use virtualization for large lists (>50 items)
  const shouldVirtualize = filteredExpenses.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: filteredExpenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90, // Estimated height of each expense item
    overscan: 5, // Number of items to render above/below visible area
    enabled: shouldVirtualize,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Track and manage group expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>Track and manage group expenses</CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredExpenses.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No expenses match your search" : "No expenses yet"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground">Add your first expense to get started</p>
            )}
          </div>
        ) : shouldVirtualize ? (
          /* Virtualized list for large datasets */
          <div
            ref={parentRef}
            className="h-[500px] overflow-auto"
            style={{ contain: "strict" }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const expense = filteredExpenses[virtualItem.index];
                return (
                  <div
                    key={expense.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="pb-4"
                  >
                    <ExpenseItem
                      expense={expense}
                      isDeleting={deletingId === expense.id}
                      onDelete={handleDelete}
                      getCategoryColor={getCategoryColor}
                    />
                  </div>
                );
              })}
            </div>
            {/* Infinite scroll trigger for virtualized list */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Regular list for small datasets */
          <>
            {filteredExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                isDeleting={deletingId === expense.id}
                onDelete={handleDelete}
                getCategoryColor={getCategoryColor}
              />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
              {!hasMore && filteredExpenses.length > 0 && !searchQuery && (
                <p className="text-sm text-muted-foreground">You&apos;ve seen all expenses</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
