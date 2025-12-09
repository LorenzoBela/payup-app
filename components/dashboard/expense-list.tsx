"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ExpenseListProps {
  userId: string;
}

export function ExpenseList({ userId }: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // TODO: Fetch real data from API
  const isLoading = false;
  
  const expenses = [
    {
      id: "1",
      description: "Printing thesis drafts",
      amount: 45.50,
      category: "printing" as const,
      paid_by: "John Doe",
      created_at: "2025-10-01T10:30:00Z",
    },
    {
      id: "2",
      description: "Team lunch meeting",
      amount: 82.25,
      category: "food" as const,
      paid_by: "Jane Smith",
      created_at: "2025-09-28T12:15:00Z",
    },
    {
      id: "3",
      description: "Office supplies",
      amount: 32.00,
      category: "supplies" as const,
      paid_by: "John Doe",
      created_at: "2025-09-25T14:20:00Z",
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      food: "bg-green-100 text-green-800",
      printing: "bg-blue-100 text-blue-800",
      supplies: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

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
              <Skeleton className="h-12 w-full" />
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
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No expenses yet</p>
            <p className="text-sm text-muted-foreground">Add your first expense to get started</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
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
                      Paid by {expense.paid_by}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    ${expense.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(expense.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

