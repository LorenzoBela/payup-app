"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
    Users,
    Search,
    ChevronRight,
    Shield,
    Building2,
    Calendar,
    Mail,
    Phone,
    Trash2,
    Loader2,
    User,
    ChevronLeft,
    ChevronDown,
    Filter
} from "lucide-react";
import { getAllUsers, getUserDetails, softDeleteUser } from "@/app/actions/admin";
import { UserRole } from "@prisma/client";

interface UserData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    gcash_number: string | null;
    created_at: Date;
    teamCount: number;
}

interface UserDetailsData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    gcash_number: string | null;
    created_at: Date;
    teams: Array<{
        teamId: string;
        teamName: string;
        teamCode: string;
        role: string;
        joinedAt: Date;
    }>;
    recentActivity: Array<{
        id: string;
        action: string;
        details: string;
        createdAt: Date;
        teamName: string;
    }>;
}

export function MobileAdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserDetailsData | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const result = await getAllUsers({
                page,
                limit: 20,
                role: roleFilter !== "all" ? roleFilter : undefined
            });
            setUsers(result.users);
            setFilteredUsers(result.users);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]);

    useEffect(() => {
        if (search.trim() === "") {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(
                (u) =>
                    u.name.toLowerCase().includes(search.toLowerCase()) ||
                    u.email.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [search, users]);

    const handleViewUser = async (user: UserData) => {
        setLoadingDetails(true);
        setDetailsOpen(true);
        try {
            const details = await getUserDetails(user.id);
            if (details) {
                setSelectedUser(details as unknown as UserDetailsData);
            }
        } catch (error) {
            console.error("Failed to fetch user details:", error);
            toast.error("Failed to load user details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            const result = await softDeleteUser(userToDelete.id);
            if (result.success) {
                toast.success(result.message);
                setDeleteDialogOpen(false);
                setUserToDelete(null);
                fetchUsers();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case "SuperAdmin":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "Client":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (isLoading && users.length === 0) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Users</h1>
                    <p className="text-sm text-muted-foreground">{users.length} total users</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                        variant={roleFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRoleFilter("all")}
                        className="shrink-0"
                    >
                        All
                    </Button>
                    <Button
                        variant={roleFilter === "SuperAdmin" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRoleFilter("SuperAdmin")}
                        className="shrink-0 gap-1"
                    >
                        <Shield className="w-3 h-3" />
                        Super Admin
                    </Button>
                    <Button
                        variant={roleFilter === "Client" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRoleFilter("Client")}
                        className="shrink-0 gap-1"
                    >
                        <User className="w-3 h-3" />
                        Client
                    </Button>
                </div>
            </div>

            {/* User Cards */}
            <div className="space-y-2">
                {filteredUsers.map((user) => (
                    <Card
                        key={user.id}
                        className="overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                        onClick={() => handleViewUser(user)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className={user.role === "SuperAdmin" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-semibold truncate">{user.name}</p>
                                        <Badge className={`text-[10px] px-1.5 py-0 ${getRoleBadgeColor(user.role)}`}>
                                            {user.role === "SuperAdmin" ? "Admin" : "User"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {user.teamCount} teams
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* User Details Sheet */}
            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
                    {loadingDetails ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : selectedUser ? (
                        <>
                            <SheetHeader className="text-left pb-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className={selectedUser.role === "SuperAdmin" ? "bg-red-100 text-red-600 text-xl" : "bg-blue-100 text-blue-600 text-xl"}>
                                            {getInitials(selectedUser.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <SheetTitle className="text-lg">{selectedUser.name}</SheetTitle>
                                        <SheetDescription className="flex items-center gap-2">
                                            <Badge className={getRoleBadgeColor(selectedUser.role)}>
                                                {selectedUser.role}
                                            </Badge>
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="space-y-4 pb-6">
                                {/* Contact Info */}
                                <Card>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedUser.email}</span>
                                        </div>
                                        {selectedUser.gcash_number && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">{selectedUser.gcash_number}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Joined {formatDistanceToNow(new Date(selectedUser.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Teams */}
                                {selectedUser.teams.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Teams ({selectedUser.teams.length})</h3>
                                        <div className="space-y-2">
                                            {selectedUser.teams.map((team) => (
                                                <Card key={team.teamId}>
                                                    <CardContent className="p-3 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-sm">{team.teamName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {team.role} • Code: {team.teamCode}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Activity */}
                                {selectedUser.recentActivity.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Recent Activity</h3>
                                        <Card>
                                            <CardContent className="p-3 space-y-2">
                                                {selectedUser.recentActivity.slice(0, 5).map((activity) => (
                                                    <div key={activity.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                                                        <p className="font-medium">{activity.action.replace(/_/g, " ")}</p>
                                                        <p className="text-muted-foreground text-xs truncate">{activity.details}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            in {activity.teamName} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Delete Button */}
                                {selectedUser.role !== "SuperAdmin" && (
                                    <Button
                                        variant="destructive"
                                        className="w-full gap-2"
                                        onClick={() => {
                                            setUserToDelete({
                                                ...selectedUser,
                                                teamCount: selectedUser.teams.length
                                            });
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete User
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : null}
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
