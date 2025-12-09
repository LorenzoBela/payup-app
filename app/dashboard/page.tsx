"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam, joinTeam } from "../actions/teams";
import { toast } from "sonner";
import { useUser, UserButton } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase-client";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [joinTeamOpen, setJoinTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getUserAndTeams = async () => {
      if (!isLoaded) return;

      if (!user) {
        router.push("/signin");
        return;
      }

      const supabase = createSupabaseClient();

      // Fetch teams
      const { data: teamMembers, error } = await supabase
        .from("team_members")
        .select(`
          team_id,
          teams (
            id,
            name,
            code,
            created_by
          )
        `)
        .eq("user_id", user.id);

      if (teamMembers) {
        setTeams(teamMembers.map((tm: any) => tm.teams));
      }
      setLoading(false);
    };
    getUserAndTeams();
  }, [user, isLoaded, router]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user) return;
    const result = await createTeam(newTeamName);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Team created successfully!");
      setCreateTeamOpen(false);
      setNewTeamName("");
      // Refresh teams
      const supabase = createSupabaseClient();
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select(`
          team_id,
          teams (
            id,
            name,
            code,
            created_by
          )
        `)
        .eq("user_id", user.id);
      if (teamMembers) {
        setTeams(teamMembers.map((tm: any) => tm.teams));
      }
    }
  };

  const handleJoinTeam = async () => {
    if (!joinTeamCode.trim() || !user) return;
    const result = await joinTeam(joinTeamCode);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Joined team successfully!");
      setJoinTeamOpen(false);
      setJoinTeamCode("");
      // Refresh teams
      const supabase = createSupabaseClient();
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select(`
          team_id,
          teams (
            id,
            name,
            code,
            created_by
          )
        `)
        .eq("user_id", user.id);
      if (teamMembers) {
        setTeams(teamMembers.map((tm: any) => tm.teams));
      }
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl">PayUp Dashboard</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
              {user.primaryEmailAddress?.emailAddress}
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₱0.00</div>
              <p className="text-xs text-muted-foreground mt-1">+0% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Your Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-sm text-muted-foreground mb-4">You are not in any teams yet.</div>
              ) : (
                <div className="space-y-2 mb-4">
                  {teams.map((team) => (
                    <div key={team.id} className="p-2 rounded bg-white/5 border border-white/10 flex justify-between items-center">
                      <span className="font-medium">{team.name}</span>
                      <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded text-muted-foreground">{team.code}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Dialog open={joinTeamOpen} onOpenChange={setJoinTeamOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" variant="outline">Join Team</Button>
                  </DialogTrigger>
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
                      <Button onClick={handleJoinTeam}>Join Team</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">Create Team</Button>
                  </DialogTrigger>
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
                      <Button onClick={handleCreateTeam}>Create Team</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Send Money</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
