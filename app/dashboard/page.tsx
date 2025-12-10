"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, DollarSign, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createTeam, joinTeam } from "../actions/teams";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { AddExpenseDialog } from "@/components/dashboard/add-expense-dialog";
import { ExpenseList } from "@/components/dashboard/expense-list";
import { SettlementsList } from "@/components/dashboard/settlements-list";
import { useTeam } from "@/components/dashboard/team-provider";
import { useTeamBalances } from "@/lib/hooks/use-dashboard-data";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedTeam, isLoading, refreshTeams } = useTeam();

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [joinTeamOpen, setJoinTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use SWR for balances with caching
  const { balances, isLoading: balancesLoading, mutate: mutateBalances } = useTeamBalances(selectedTeam?.id || null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/signin");
      return;
    }
  }, [user, isLoaded, router]);

  // Handle URL actions
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create-team") {
      setCreateTeamOpen(true);
    } else if (action === "join-team") {
      setJoinTeamOpen(true);
    }
  }, [searchParams]);

  const handleExpenseAdded = () => {
    setRefreshKey((prev) => prev + 1);
    mutateBalances(); // Refresh balances via SWR
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setActionLoading(true);
    try {
      const result = await createTeam(newTeamName);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team created successfully!");
        setCreateTeamOpen(false);
        setNewTeamName("");
        await refreshTeams();
        router.replace("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinTeamCode.trim()) return;
    setActionLoading(true);
    try {
      const result = await joinTeam(joinTeamCode);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Joined team successfully!");
        setJoinTeamOpen(false);
        setJoinTeamCode("");
        await refreshTeams();
        router.replace("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {selectedTeam ? (
        <>
          {/* Team Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{selectedTeam.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                Team Code: <code className="bg-muted px-2 py-0.5 rounded font-mono text-sm">{selectedTeam.code}</code>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {selectedTeam.role}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <AddExpenseDialog teamId={selectedTeam.id} onExpenseAdded={handleExpenseAdded} />
              <Button variant="outline" onClick={() => document.getElementById('settlements-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Settle Up
              </Button>
            </div>
          </div>

          {/* Stats Cards with skeleton loading */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className={`text-2xl font-bold ${balances.owedToYou - balances.youOwe >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₱{(balances.owedToYou - balances.youOwe).toFixed(2)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Net balance across team</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">You Owe</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-red-500">₱{balances.youOwe.toFixed(2)}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  to {balances.youOweCount} member{balances.youOweCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owed to You</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-green-500">₱{balances.owedToYou.toFixed(2)}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  from {balances.owedToYouCount} member{balances.owedToYouCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content Area */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <ExpenseList teamId={selectedTeam.id} refreshKey={refreshKey} />
            </div>
            <div className="col-span-3 space-y-4">
              <div id="settlements-section">
                <SettlementsList teamId={selectedTeam.id} refreshKey={refreshKey} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>{selectedTeam.memberCount} members in this team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">Share code: <code className="bg-muted px-2 py-0.5 rounded font-mono">{selectedTeam.code}</code></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="bg-secondary/50 p-6 rounded-full">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Welcome to PayUp!</h2>
          <p className="text-muted-foreground max-w-md">
            You are not part of any team yet. Create a new team or join an existing one to get started.
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" onClick={() => setCreateTeamOpen(true)}>Create Team</Button>
            <Button size="lg" variant="outline" onClick={() => setJoinTeamOpen(true)}>Join Team</Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={joinTeamOpen} onOpenChange={(open) => { setJoinTeamOpen(open); if (!open) router.replace("/dashboard"); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Team Code</Label>
              <Input
                id="code"
                placeholder="Enter 6-character code"
                value={joinTeamCode}
                onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleJoinTeam} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Join Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createTeamOpen} onOpenChange={(open) => { setCreateTeamOpen(open); if (!open) router.replace("/dashboard"); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateTeam} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
