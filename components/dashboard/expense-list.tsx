"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt, Trash2, Search, Loader2, Clock, ChevronDown, ChevronUp,
  CalendarDays, CheckCircle2, XCircle, AlertCircle, User, Filter,
  Grid3X3, List, X, SlidersHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deleteExpense, getMonthlyBreakdown } from "@/app/actions/expenses";
import { useTeamExpenses } from "@/lib/hooks/use-dashboard-data";
import { useTeam } from "@/components/dashboard/team-provider";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditExpenseDialog } from "@/components/dashboard/edit-expense-dialog";
import { useUser } from "@clerk/nextjs";

// Categories available
const CATEGORIES = ["All", "Food", "Printing", "Supplies", "Transportation", "Utilities", "Other"];

// Payment status options
const PAYMENT_STATUS = ["All", "Fully Paid", "Partially Paid", "Unpaid"];

// Type for settlement with member name
interface Settlement {
  id: string;
  owed_by: string;
  amount_owed: number;
  status: string;
  paid_at: Date | null;
  member_name: string;
}

// Type for child monthly expense
interface ChildExpense {
  id: string;
  description: string;
  amount: number;
  month_number: number | null;
  total_months: number | null;
  deadline: Date | null;
  paid_by_name: string;
  settlements: Settlement[];
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    case "unconfirmed":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Unpaid
        </Badge>
      );
  }
}

// Member payment list component
function MemberPaymentList({ settlements, compact = false }: { settlements: Settlement[]; compact?: boolean }) {
  if (settlements.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-1.5">
        {settlements.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 text-xs bg-muted/30 px-2 py-1.5 rounded-md">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{s.member_name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-muted-foreground">₱{s.amount_owed.toFixed(0)}</span>
              <StatusBadge status={s.status} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Member Status:</p>
      <div className="flex flex-wrap gap-2">
        {settlements.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 text-xs"
          >
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium">{s.member_name}</span>
            <span className="text-muted-foreground">₱{s.amount_owed.toFixed(0)}</span>
            <StatusBadge status={s.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Expense interface
interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  category: string;
  paid_by_name: string;
  created_at: Date;
  is_monthly: boolean;
  month_number: number | null;
  total_months: number | null;
  deadline: Date | null;
  deadline_day: number | null;
  settlements: Settlement[];
  note?: string | null;
}

// Grid Card Component
const ExpenseGridCard = memo(function ExpenseGridCard({
  expense,
  isDeleting,
  onDelete,
  getCategoryColor,
  onExpand,
  isExpanded,
  isLoadingChildren,
  childExpenses,
  onCardClick,
  isAdmin,
  canEdit,
  onRefresh,
}: {
  expense: ExpenseData;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  getCategoryColor: (category: string) => string;
  onExpand: (e: React.MouseEvent) => void;
  isExpanded: boolean;
  isLoadingChildren: boolean;
  childExpenses: ChildExpense[];
  onCardClick: () => void;
  isAdmin: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const paidCount = expense.settlements.filter(s => s.status === "paid").length;
  const totalMembers = expense.settlements.length;
  const paymentPercentage = totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0;

  return (
    <div className="group relative">
      <div
        className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full flex flex-col cursor-pointer"
        onClick={onCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <Badge variant="secondary" className={`${getCategoryColor(expense.category)} text-xs`}>
              {expense.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {(isAdmin || canEdit) && (
              <div onClick={(e) => e.stopPropagation()}>
                <EditExpenseDialog
                  expenseId={expense.id}
                  currentDescription={expense.description}
                  currentNote={expense.note}
                  onExpenseUpdated={onRefresh}
                  iconOnly
                  triggerClassName="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Title & Amount */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{expense.description}</h3>
          {expense.note && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 italic">{expense.note}</p>
          )}
          <p className="text-2xl font-bold text-primary">₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          {expense.is_monthly && expense.total_months && (
            <p className="text-xs text-muted-foreground mt-1">
              ₱{(expense.amount / expense.total_months).toFixed(0)}/month × {expense.total_months} months
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {totalMembers > 0 && (
          <div className="my-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className={paidCount === totalMembers ? "text-green-500" : "text-muted-foreground"}>
                {paidCount}/{totalMembers}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${paymentPercentage === 100 ? 'bg-green-500' :
                  paymentPercentage > 50 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Member Status (Compact) */}
        {!expense.is_monthly && expense.settlements.length > 0 && (
          <div className="pt-3 border-t border-border/50 mt-auto">
            <MemberPaymentList settlements={expense.settlements} compact />
          </div>
        )}

        {/* Monthly Badge & Expand */}
        {expense.is_monthly && (
          <div className="pt-3 border-t border-border/50 mt-auto">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                <CalendarDays className="w-3 h-3 mr-1" />
                Monthly Plan
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                disabled={isLoadingChildren}
                className="h-7 text-xs"
              >
                {isLoadingChildren ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    {isExpanded ? "Hide" : "View"} Breakdown
                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
          <span>Paid by {expense.paid_by_name}</span>
          <span>{new Date(expense.created_at).toLocaleDateString()}</span>
        </div>

        {/* Monthly Breakdown Inline */}
        {isExpanded && expense.is_monthly && childExpenses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2 max-h-[250px] overflow-y-auto">
            {childExpenses.map((child) => {
              const childPaidCount = child.settlements.filter(s => s.status === "paid").length;
              const childTotalMembers = child.settlements.length;
              return (
                <div key={child.id} className="p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {child.month_number}
                      </div>
                      <span className="font-medium text-sm">Month {child.month_number}</span>
                      {childTotalMembers > 0 && (
                        <Badge variant="outline" className={`text-[10px] ${childPaidCount === childTotalMembers ? 'border-green-500/50 text-green-600' : 'border-border'}`}>
                          {childPaidCount}/{childTotalMembers}
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold">₱{child.amount.toFixed(0)}</span>
                  </div>
                  {child.deadline && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-2">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(child.deadline).toLocaleDateString()}
                    </div>
                  )}
                  {child.settlements.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {child.settlements.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 text-xs bg-background px-2 py-1.5 rounded border border-border/50">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">{s.member_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₱{s.amount_owed.toFixed(0)}</span>
                            <StatusBadge status={s.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

// Wrapper component to handle expand state
const ExpenseGridItem = memo(function ExpenseGridItem({
  expense,
  isDeleting,
  onDelete,
  getCategoryColor,
  isAdmin,
  userId,
  onRefresh,
}: {
  expense: ExpenseData;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  getCategoryColor: (category: string) => string;
  isAdmin: boolean;
  userId: string | null;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [childExpenses, setChildExpenses] = useState<ChildExpense[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  // User can edit if they're admin or the expense owner
  const canEdit = isAdmin || (userId !== null && expense.paid_by_name !== 'Former Member');

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!expense.is_monthly) return;

    if (!isExpanded && childExpenses.length === 0) {
      setIsLoadingChildren(true);
      try {
        const result = await getMonthlyBreakdown(expense.id);
        setChildExpenses(result.childExpenses as ChildExpense[]);
      } catch {
        toast.error("Failed to load monthly breakdown");
      } finally {
        setIsLoadingChildren(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = () => {
    router.push(`/dashboard/expenses/${expense.id}`);
  };

  return (
    <ExpenseGridCard
      expense={expense}
      isDeleting={isDeleting}
      onDelete={onDelete}
      getCategoryColor={getCategoryColor}
      onExpand={handleToggleExpand}
      isExpanded={isExpanded}
      isLoadingChildren={isLoadingChildren}
      childExpenses={childExpenses}
      onCardClick={handleCardClick}
      isAdmin={isAdmin}
      canEdit={canEdit}
      onRefresh={onRefresh}
    />
  );
});

// List Item Component (keeping original for toggle)
const ExpenseListItem = memo(function ExpenseListItem({
  expense,
  isDeleting,
  onDelete,
  getCategoryColor,
  isAdmin,
  userId,
  onRefresh,
}: {
  expense: ExpenseData;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  getCategoryColor: (category: string) => string;
  isAdmin: boolean;
  userId: string | null;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [childExpenses, setChildExpenses] = useState<ChildExpense[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  // User can edit if they're admin or the expense owner
  const canEdit = isAdmin || (userId !== null && expense.paid_by_name !== 'Former Member');

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expense.is_monthly) return;

    if (!isExpanded && childExpenses.length === 0) {
      setIsLoadingChildren(true);
      try {
        const result = await getMonthlyBreakdown(expense.id);
        setChildExpenses(result.childExpenses as ChildExpense[]);
      } catch {
        toast.error("Failed to load monthly breakdown");
      } finally {
        setIsLoadingChildren(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = () => {
    router.push(`/dashboard/expenses/${expense.id}`);
  };

  const paidCount = expense.settlements.filter(s => s.status === "paid").length;
  const totalMembers = expense.settlements.length;

  return (
    <div className="space-y-2">
      <div
        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{expense.description}</p>
              {expense.note && (
                <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">{expense.note}</p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                  {expense.category}
                </Badge>
                {expense.is_monthly && expense.total_months && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30">
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {expense.total_months} months
                  </Badge>
                )}
                {totalMembers > 0 && (
                  <Badge variant="outline" className={paidCount === totalMembers ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-muted"}>
                    {paidCount}/{totalMembers} paid
                  </Badge>
                )}
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
              <p className="text-xs text-muted-foreground">
                {new Date(expense.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              {expense.is_monthly && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleExpand}
                  disabled={isLoadingChildren}
                >
                  {isLoadingChildren ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
              {(isAdmin || canEdit) && (
                <div onClick={(e) => e.stopPropagation()}>
                  <EditExpenseDialog
                    expenseId={expense.id}
                    currentDescription={expense.description}
                    currentNote={expense.note}
                    onExpenseUpdated={onRefresh}
                    iconOnly
                  />
                </div>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {!expense.is_monthly && <MemberPaymentList settlements={expense.settlements} />}
      </div>

      {/* Monthly breakdown */}
      {isExpanded && expense.is_monthly && (
        <div className="ml-8 pl-4 border-l-2 border-primary/20 space-y-3">
          {childExpenses.map((child) => {
            const childPaidCount = child.settlements.filter(s => s.status === "paid").length;
            const childTotalMembers = child.settlements.length;
            return (
              <div key={child.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {child.month_number}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{child.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {child.deadline && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(child.deadline).toLocaleDateString()}
                          </div>
                        )}
                        {childTotalMembers > 0 && (
                          <Badge variant="outline" className={childPaidCount === childTotalMembers ? "bg-green-500/10 text-green-600 border-green-500/30 text-xs" : "bg-muted text-xs"}>
                            {childPaidCount}/{childTotalMembers} paid
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold">₱{child.amount.toFixed(2)}</p>
                </div>
                <MemberPaymentList settlements={child.settlements} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

interface ExpenseListProps {
  teamId: string;
  refreshKey?: number;
}

export function ExpenseList({ teamId, refreshKey }: ExpenseListProps) {
  const { selectedTeam } = useTeam();
  const { user } = useUser();
  const isAdmin = selectedTeam?.role === 'admin';
  const userId = user?.id || null;

  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    expenses,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    mutate
  } = useTeamExpenses(teamId);

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

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
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
        mutate();
        toast.error(result.error);
      } else {
        toast.success("Expense deleted");
        mutate();
      }
    } catch {
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

  // Calculate payment status
  const getPaymentStatus = (expense: ExpenseData) => {
    const totalMembers = expense.settlements.length;
    if (totalMembers === 0) return "none";
    const paidCount = expense.settlements.filter(s => s.status === "paid").length;
    if (paidCount === totalMembers) return "fully_paid";
    if (paidCount > 0) return "partially_paid";
    return "unpaid";
  };

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter((expense) => {
      // Search filter
      const matchesSearch =
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.paid_by_name.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === "All" ||
        expense.category.toLowerCase() === categoryFilter.toLowerCase();

      // Status filter
      const status = getPaymentStatus(expense);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Fully Paid" && status === "fully_paid") ||
        (statusFilter === "Partially Paid" && status === "partially_paid") ||
        (statusFilter === "Unpaid" && status === "unpaid");

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [expenses, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

  // Active filters count
  const activeFiltersCount = [
    categoryFilter !== "All",
    statusFilter !== "All",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategoryFilter("All");
    setStatusFilter("All");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Track and manage group expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl border border-border bg-muted/20 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track and manage group expenses</CardDescription>
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [newSortBy, newOrder] = value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
              setSortBy(newSortBy);
              setSortOrder(newOrder);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="amount-desc">Highest Amount</SelectItem>
              <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
              <X className="w-4 h-4 mr-1" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </CardHeader>

      <CardContent>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || activeFiltersCount > 0 ? "No expenses match your filters" : "No expenses yet"}
            </p>
            {(searchQuery || activeFiltersCount > 0) && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExpenses.map((expense) => (
              <ExpenseGridItem
                key={expense.id}
                expense={expense}
                isDeleting={deletingId === expense.id}
                onDelete={handleDelete}
                getCategoryColor={getCategoryColor}
                isAdmin={isAdmin}
                userId={userId}
                onRefresh={() => mutate()}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <ExpenseListItem
                key={expense.id}
                expense={expense}
                isDeleting={deletingId === expense.id}
                onDelete={handleDelete}
                getCategoryColor={getCategoryColor}
                isAdmin={isAdmin}
                userId={userId}
                onRefresh={() => mutate()}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && filteredExpenses.length > 0 && !searchQuery && activeFiltersCount === 0 && (
            <p className="text-sm text-muted-foreground">You&apos;ve seen all expenses</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
