"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { softDeleteUser, removeUserFromTeam } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Shield,
    Users,
    Activity,
    Trash2,
    UserMinus,
    Loader2,
    Calendar,
    Mail,
    Phone,
    Building2
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface UserTeam {
    teamId: string;
    teamName: string;
    teamCode: string;
    role: string;
    joinedAt: Date;
}

interface UserActivity {
    id: string;
    action: string;
    details: string;
    createdAt: Date;
    teamName: string;
}

interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    gcash_number: string | null;
    created_at: Date;
    updated_at: Date;
    teams: UserTeam[];
    recentActivity: UserActivity[];
}

interface UserDetailsClientProps {
    user: UserDetails;
}

export function UserDetailsClient({ user }: UserDetailsClientProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [removingFromTeam, setRemovingFromTeam] = useState<string | null>(null);

    const handleDeleteUser = async () => {
        setIsDeleting(true);
        try {
            const result = await softDeleteUser(user.id);
            if (result.success) {
                toast.success(result.message);
                router.push("/admin/users");
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to delete user");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleRemoveFromTeam = async (teamId: string) => {
        setRemovingFromTeam(teamId);
        try {
            const result = await removeUserFromTeam(user.id, teamId);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to remove user from team");
        } finally {
            setRemovingFromTeam(null);
        }
    };

    const isSuperAdmin = user.role === "SuperAdmin";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                            {isSuperAdmin && (
                                <Badge variant="destructive" className="gap-1">
                                    <Shield className="h-3 w-3" />
                                    SuperAdmin
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                {!isSuperAdmin && (
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete &quot;{user.name}&quot;?
                                    This will soft-delete the user, making them unable to log in.
                                    Their data will be preserved for record-keeping.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteUser}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete User"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* User Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Email</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">GCash Number</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">
                            {user.gcash_number || <span className="text-muted-foreground">Not set</span>}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teams</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{user.teams.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Joined</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Teams Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Memberships
                    </CardTitle>
                    <CardDescription>
                        Teams this user belongs to
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {user.teams.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.teams.map((team) => (
                                        <TableRow key={team.teamId}>
                                            <TableCell>
                                                <Link
                                                    href={`/admin/teams/${team.teamId}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {team.teamName}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-muted px-2 py-0.5 rounded text-sm">
                                                    {team.teamCode}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={team.role === "ADMIN" ? "default" : "outline"}>
                                                    {team.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDistanceToNow(new Date(team.joinedAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRemoveFromTeam(team.teamId)}
                                                    disabled={removingFromTeam === team.teamId}
                                                >
                                                    {removingFromTeam === team.teamId ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <UserMinus className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            User is not a member of any teams
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>
                        Last 20 actions by this user
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {user.recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {user.recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs">
                                                {activity.action.replace(/_/g, " ")}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                in {activity.teamName}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground truncate">
                                            {activity.details}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No activity recorded for this user
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
