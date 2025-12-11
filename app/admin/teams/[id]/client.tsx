"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { softDeleteTeam, removeUserFromTeam } from "@/app/actions/admin";
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
    Users,
    Receipt,
    Trash2,
    UserMinus,
    Loader2,
    Calendar,
    Hash,
    Activity,
    DollarSign,
    Shield
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface TeamMember {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    teamRole: string;
    joinedAt: Date;
}

interface TeamExpense {
    id: string;
    amount: number;
    description: string;
    category: string;
    created_at: Date;
}

interface TeamDetails {
    id: string;
    name: string;
    code: string;
    created_at: Date;
    memberCount: number;
    expenseCount: number;
    activityCount: number;
    totalExpenseVolume: number;
    members: TeamMember[];
    recentExpenses: TeamExpense[];
}

interface TeamDetailsClientProps {
    team: TeamDetails;
}

export function TeamDetailsClient({ team }: TeamDetailsClientProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [removingMember, setRemovingMember] = useState<string | null>(null);

    const handleDeleteTeam = async () => {
        setIsDeleting(true);
        try {
            const result = await softDeleteTeam(team.id);
            if (result.success) {
                toast.success(result.message);
                router.push("/admin/teams");
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to delete team");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        setRemovingMember(userId);
        try {
            const result = await removeUserFromTeam(userId, team.id);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to remove member");
        } finally {
            setRemovingMember(null);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            food: "bg-orange-500/10 text-orange-500",
            printing: "bg-blue-500/10 text-blue-500",
            supplies: "bg-green-500/10 text-green-500",
            other: "bg-gray-500/10 text-gray-500",
        };
        return colors[category] || colors.other;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/teams">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
                                {team.code}
                            </code>
                            <span className="text-muted-foreground text-sm">
                                Created {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </div>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Team
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Team</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete &quot;{team.name}&quot;?
                                This will remove all team members and soft-delete all expenses.
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteTeam}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Team"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{team.memberCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{team.expenseCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            ₱{team.totalExpenseVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activities</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{team.activityCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Members Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                    <CardDescription>
                        {team.memberCount} members in this team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {team.members.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Team Role</TableHead>
                                        <TableHead>System Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {team.members.map((member) => (
                                        <TableRow key={member.userId}>
                                            <TableCell>
                                                <div>
                                                    <Link
                                                        href={`/admin/users/${member.userId}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {member.userName}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.userEmail}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.teamRole === "ADMIN" ? "default" : "outline"}>
                                                    {member.teamRole}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {member.userRole === "SuperAdmin" ? (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        SuperAdmin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Client</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    disabled={removingMember === member.userId}
                                                >
                                                    {removingMember === member.userId ? (
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
                            No members in this team
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Recent Expenses Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Recent Expenses
                    </CardTitle>
                    <CardDescription>
                        Last 20 expenses in this team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {team.recentExpenses.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {team.recentExpenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium max-w-[300px] truncate">
                                                {expense.description}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ₱{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getCategoryColor(expense.category)}>
                                                    {expense.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No expenses in this team
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
