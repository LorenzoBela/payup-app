"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllUsers, softDeleteUser } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Search,
    Users,
    Shield,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    MoreHorizontal,
    Eye,
    Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    email: string;
    role: "Client" | "SuperAdmin";
    gcash_number: string | null;
    created_at: Date;
    teamCount: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllUsers({
                page,
                limit: 20,
                search: search || undefined,
                role: roleFilter !== "all" ? (roleFilter as "Client" | "SuperAdmin") : undefined,
            });
            setUsers(result.users as User[]);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const result = await softDeleteUser(userToDelete.id);
            if (result.success) {
                toast.success(result.message);
                fetchUsers();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to delete user");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
                <p className="text-muted-foreground">
                    View and manage all users in the system. Roles can only be modified in Supabase Dashboard.
                </p>
            </div>

            {/* Security Notice */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    User roles are <strong>read-only</strong> in this interface. To promote a user to SuperAdmin,
                    you must manually edit the <code className="bg-muted px-1 rounded">role</code> field directly
                    in the Supabase Dashboard table editor.
                </AlertDescription>
            </Alert>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Users
                    </CardTitle>
                    <CardDescription>
                        {total} total users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="Client">Clients</SelectItem>
                                <SelectItem value="SuperAdmin">SuperAdmins</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit">Search</Button>
                    </form>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length > 0 ? (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Teams</TableHead>
                                            <TableHead>GCash</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="w-[70px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div>
                                                        <Link
                                                            href={`/admin/users/${user.id}`}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {user.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.role === "SuperAdmin" ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <Shield className="h-3 w-3" />
                                                            SuperAdmin
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Client</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{user.teamCount}</TableCell>
                                                <TableCell>
                                                    {user.gcash_number ? (
                                                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                            {user.gcash_number}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/users/${user.id}`}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {user.role !== "SuperAdmin" && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => handleDeleteClick(user)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete User
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-12">
                            No users found
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{userToDelete?.name}&quot;?
                            This will soft-delete the user, making them unable to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
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
        </div>
    );
}
