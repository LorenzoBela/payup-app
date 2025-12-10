"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Settings,
    Bell,
    Shield,
    Palette,
    Trash2,
    Save
} from "lucide-react";
import { toast } from "sonner";
import { useTeam } from "@/components/dashboard/team-provider";
import { renameTeam, removeTeamMember, getTeamMembers } from "@/app/actions/teams";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, MoreVertical, LogOut, Copy } from "lucide-react";

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [emailDigest, setEmailDigest] = useState(false);

    // Team Context
    const { selectedTeam, refreshTeams } = useTeam();
    const [teamName, setTeamName] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);

    // Initialize team name
    useEffect(() => {
        if (selectedTeam) {
            setTeamName(selectedTeam.name);
        }
    }, [selectedTeam]);

    // Fetch members when team changes
    useEffect(() => {
        async function fetchMembers() {
            if (!selectedTeam) return;
            setLoadingMembers(true);
            try {
                const teamMembers = await getTeamMembers(selectedTeam.id);
                setMembers(teamMembers);
            } catch (error) {
                console.error("Failed to fetch members", error);
                toast.error("Failed to load team members");
            } finally {
                setLoadingMembers(false);
            }
        }
        fetchMembers();
    }, [selectedTeam]);

    const handleSave = async () => {
        try {
            if (selectedTeam && teamName !== selectedTeam.name) {
                if (selectedTeam.role !== 'ADMIN') {
                    toast.error("Only admins can rename the team");
                    return;
                }

                setIsRenaming(true);
                const result = await renameTeam(selectedTeam.id, teamName);

                if (result.error) {
                    toast.error(result.error);
                } else {
                    await refreshTeams();
                    toast.success("Team settings saved!");
                }
                setIsRenaming(false);
            } else {
                toast.success("Settings saved successfully!");
            }
        } catch (error) {
            toast.error("Something went wrong");
            setIsRenaming(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedTeam) return;

        // Optimistic UI update could go here, but let's stick to safe server action first
        const result = await removeTeamMember(selectedTeam.id, memberId);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Member removed from team");
            // Refresh members list
            const updatedMembers = await getTeamMembers(selectedTeam.id);
            setMembers(updatedMembers);
            refreshTeams(); // Update member count in context if tracked
        }
    };

    const handleCopyCode = () => {
        if (selectedTeam?.code) {
            navigator.clipboard.writeText(selectedTeam.code);
            toast.success("Team code copied to clipboard");
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and team preferences</p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Profile Settings
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" disabled />
                        <p className="text-xs text-muted-foreground">Email is managed by your authentication provider</p>
                    </div>
                </CardContent>
            </Card>

            {/* Team Settings */}
            {selectedTeam && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Team Settings
                        </CardTitle>
                        <CardDescription>Manage your team {selectedTeam.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Team Name & Code */}
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="teamName">Team Name</Label>
                                <Input
                                    id="teamName"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Enter team name"
                                    disabled={selectedTeam.role !== "ADMIN"}
                                />
                                {selectedTeam.role !== "ADMIN" && (
                                    <p className="text-xs text-muted-foreground">Only admins can rename the team</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="teamCode">Invite Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="teamCode"
                                        value={selectedTeam.code}
                                        readOnly
                                        className="font-mono bg-muted"
                                    />
                                    <Button variant="outline" size="icon" onClick={handleCopyCode}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Members List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">Team Members ({members.length})</Label>
                            </div>

                            <div className="space-y-3">
                                {loadingMembers ? (
                                    <div className="text-sm text-muted-foreground">Loading members...</div>
                                ) : (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="grid gap-0.5">
                                                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                                                        {member.name}
                                                        {member.id === selectedTeam.id && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                                                    {member.role}
                                                </Badge>

                                                {selectedTeam.role === "ADMIN" && member.role !== "ADMIN" && ( // Prevent removing admins or self for simplicity, or add logic
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => handleRemoveMember(member.id)}
                                                            >
                                                                <LogOut className="w-4 h-4 mr-2" />
                                                                Remove Member
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive push notifications for new expenses
                            </p>
                        </div>
                        <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Email Digest</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive weekly email summary of expenses
                            </p>
                        </div>
                        <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Appearance
                    </CardTitle>
                    <CardDescription>Customize how PayUp looks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label>Currency</Label>
                        <Input value="₱ PHP (Philippine Peso)" disabled />
                        <p className="text-xs text-muted-foreground">Currency is set to Philippine Peso</p>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Shield className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Leave Team</Label>
                            <p className="text-sm text-muted-foreground">
                                Leave the current team (cannot be undone)
                            </p>
                        </div>
                        <Button variant="outline" className="text-destructive border-destructive/50">
                            Leave Team
                        </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Delete Account</Label>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <Button variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isRenaming}>
                    <Save className="w-4 h-4 mr-2" />
                    {isRenaming ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
