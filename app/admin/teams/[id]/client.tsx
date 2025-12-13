"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { softDeleteTeam, removeUserFromTeam, searchUsersForTeam, adminAddUserToTeam } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    UserPlus,
    Loader2,
    Calendar,
    Hash,
    Activity,
    DollarSign,
    Shield,
    Search
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

    // Add Member state
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Array<{
        id: string;
        name: string;
        email: string;
        role: string;
    }>>([]);
    const [selectedUser, setSelectedUser] = useState<{
        id: string;
        name: string;
        email: string;
    } | null>(null);
    const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Debounced search function
    const searchUsers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const result = await searchUsersForTeam(team.id, query);
            setSearchResults(result.users || []);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [team.id]);

    // Debounce effect for search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(userSearchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearchQuery, searchUsers]);

    // Handle adding member
    const handleAddMember = async () => {
        if (!selectedUser) return;
        setIsAddingMember(true);
        try {
            const result = await adminAddUserToTeam(team.id, selectedUser.id, selectedRole);
            if (result.success) {
                toast.success(result.message);
                setAddMemberDialogOpen(false);
                setSelectedUser(null);
                setUserSearchQuery("");
                setSearchResults([]);
                setSelectedRole("MEMBER");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to add member");
        } finally {
            setIsAddingMember(false);
        }
    };

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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members
                        </CardTitle>
                        <CardDescription>
                            {team.memberCount} members in this team
                        </CardDescription>
                    </div>
                    <Dialog open={addMemberDialogOpen} onOpenChange={(open) => {
                        setAddMemberDialogOpen(open);
                        if (!open) {
                            setSelectedUser(null);
                            setUserSearchQuery("");
                            setSearchResults([]);
                            setSelectedRole("MEMBER");
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Member to Team</DialogTitle>
                                <DialogDescription>
                                    Search for an existing user to add to this team.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* User Search */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Search User</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or email..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Search Results */}
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${selectedUser?.id === user.id
                                                        ? "border-primary bg-primary/5"
                                                        : "hover:bg-muted"
                                                    }`}
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                                {user.role === "SuperAdmin" && (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : userSearchQuery.length >= 2 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No users found
                                    </p>
                                ) : userSearchQuery.length > 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Type at least 2 characters to search
                                    </p>
                                ) : null}

                                {/* Selected User & Role */}
                                {selectedUser && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Selected:</span>
                                            <span className="text-sm">{selectedUser.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Role:</span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={selectedRole === "MEMBER" ? "default" : "outline"}
                                                    onClick={() => setSelectedRole("MEMBER")}
                                                >
                                                    Member
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={selectedRole === "ADMIN" ? "default" : "outline"}
                                                    onClick={() => setSelectedRole("ADMIN")}
                                                >
                                                    Admin
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setAddMemberDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddMember}
                                    disabled={!selectedUser || isAddingMember}
                                >
                                    {isAddingMember ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Adding...
                                        </>
                                    ) : (
                                        "Add Member"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
