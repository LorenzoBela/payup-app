"use client";

import Link from "next/link";
import Image from "next/image";
import { DollarSign, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  user: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">PayUp</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/dashboard/expenses" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All Expenses
          </Link>
          <Link 
            href="/dashboard/settlements" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Settlements
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {user.picture ? (
                <Image 
                  src={user.picture} 
                  alt={user.name || "User"} 
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user.name || "User"}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/auth/logout" className="cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

