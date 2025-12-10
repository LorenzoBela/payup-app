"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Copy, UserPlus, Mail, Shield, Loader2, Users } from "lucide-react";
import { useTeam } from "@/components/dashboard/team-provider";
import { useTeamMembers } from "@/lib/hooks/use-dashboard-data";
import { toast } from "sonner";

// Helper to get initials
function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function MembersPage() {
    const { selectedTeam, isLoading: teamLoading } = useTeam();
    const [searchQuery, setSearchQuery] = useState("");

    const { members, isLoading: membersLoading } = useTeamMembers(selectedTeam?.id || null);

    const copyInviteCode = () => {
        if (selectedTeam) {
            navigator.clipboard.writeText(selectedTeam.code);
            toast.success("Invite code copied to clipboard!");
        }
    };

    const filteredMembers = members.filter(
        (member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (teamLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <Users className="w-12 h-12 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">No Team Selected</h2>
                <p className="text-muted-foreground">Select a team to view members.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
                    <p className="text-muted-foreground">Manage your team and invites</p>
                </div>
            </div>

            {/* Invite Code */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className="font-semibold text-lg flex items-center justify-center sm:justify-start gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                Invite New Members
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Share this code with others to let them join your team.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto bg-background p-1.5 rounded-lg border">
                            <code className="flex-1 sm:flex-none px-4 py-1 text-lg font-mono font-bold tracking-wider text-center">
                                {selectedTeam.code}
                            </code>
                            <Button size="icon" variant="ghost" onClick={copyInviteCode} className="shrink-0">
                                <Copy className="w-4 h-4" />
                                <span className="sr-only">Copy code</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Member List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Members ({members.length})</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search members..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {membersLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {searchQuery ? "No members found matching your search." : "No members in this team yet."}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src="" />
                                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {member.name}
                                                {member.role === "ADMIN" && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {member.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
