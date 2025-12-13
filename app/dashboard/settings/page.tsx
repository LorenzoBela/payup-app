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
import { renameTeam, removeTeamMember, getTeamMembers, leaveTeam, recalculateTeamExpenses } from "@/app/actions/teams";
import { deleteAccount } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, MoreVertical, LogOut, Copy, RefreshCw } from "lucide-react";
import { useClerk } from "@clerk/nextjs";


export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [emailDigest, setEmailDigest] = useState(false);

    // Team Context
    const { selectedTeam, refreshTeams } = useTeam();
    const [teamName, setTeamName] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [isLeavingTeam, setIsLeavingTeam] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const { signOut } = useClerk();


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

    const handleLeaveTeam = async () => {
        if (!selectedTeam) return;

        setIsLeavingTeam(true);
        try {
            const result = await leaveTeam(selectedTeam.id);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("You have left the team");
                await refreshTeams();
            }
        } catch (error) {
            toast.error("Failed to leave team");
        } finally {
            setIsLeavingTeam(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            const result = await deleteAccount();

            if (result.error) {
                toast.error(result.error);
                setIsDeletingAccount(false);
            } else {
                toast.success("Account deleted successfully");
                // Sign out of Clerk after account deletion
                await signOut({ redirectUrl: "/" });
            }
        } catch (error) {
            toast.error("Failed to delete account");
            setIsDeletingAccount(false);
        }
    };

    const handleRecalculate = async () => {
        if (!selectedTeam) return;

        setIsRecalculating(true);
        try {
            const result = await recalculateTeamExpenses(selectedTeam.id);

            if ('error' in result && result.error) {
                toast.error(result.error);
            } else if ('success' in result) {
                toast.success(
                    `Recalculated ${result.expensesProcessed} expense(s). ` +
                    `Removed ${result.settlementsRemoved} orphaned, ` +
                    `updated ${result.settlementsUpdated}, ` +
                    `created ${result.settlementsCreated} new settlement(s).`
                );
                // Refresh members and teams to reflect any changes
                const updatedMembers = await getTeamMembers(selectedTeam.id);
                setMembers(updatedMembers);
                await refreshTeams();
            }
        } catch (error) {
            toast.error("Failed to recalculate expenses");
        } finally {
            setIsRecalculating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto px-1 sm:px-0">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage your account and team preferences</p>
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

                        {/* Recalculate Expenses */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
                            <div className="space-y-0.5">
                                <Label>Recalculate Expenses</Label>
                                <p className="text-sm text-muted-foreground">
                                    Refresh and recalculate all pending expenses for active members only
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={isRecalculating || selectedTeam.role !== "ADMIN"}
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                                        {isRecalculating ? "Recalculating..." : "Recalculate"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Recalculate All Expenses?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will recalculate all pending expenses for active team members only.
                                            Settlements for removed members will be deleted and amounts will be
                                            redistributed evenly among current members.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRecalculate}>
                                            Recalculate
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
                                        <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card/50 gap-3">
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
                    {selectedTeam && (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Leave Team</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Leave {selectedTeam.name} (cannot be undone)
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="text-destructive border-destructive/50"
                                            disabled={isLeavingTeam}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            {isLeavingTeam ? "Leaving..." : "Leave Team"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Leave {selectedTeam.name}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to leave this team? You will lose access to all expenses and settlements in this team. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleLeaveTeam}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Leave Team
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <Separator />
                        </>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <Label>Delete Account</Label>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeletingAccount}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove you from all teams. All your expense data will be preserved for other team members.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
