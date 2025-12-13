"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllTeams, softDeleteTeam } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    Building2,
    Users,
    Receipt,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface Team {
    id: string;
    name: string;
    code: string;
    created_at: Date;
    memberCount: number;
    expenseCount: number;
}

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllTeams({
                page,
                limit: 20,
                search: search || undefined,
            });
            setTeams(result.teams as Team[]);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        } catch (error) {
            console.error("Error fetching teams:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchTeams();
    };

    const handleDeleteClick = (team: Team) => {
        setTeamToDelete(team);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!teamToDelete) return;

        setIsDeleting(true);
        try {
            const result = await softDeleteTeam(teamToDelete.id);
            if (result.success) {
                toast.success(result.message);
                fetchTeams();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to delete team");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setTeamToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Teams Management</h1>
                <p className="text-muted-foreground">
                    View and manage all teams across the system.
                </p>
            </div>

            {/* Teams Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        All Teams
                    </CardTitle>
                    <CardDescription>
                        {total} total teams
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : teams.length > 0 ? (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Members</TableHead>
                                            <TableHead>Expenses</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="w-[70px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teams.map((team) => (
                                            <TableRow key={team.id}>
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/teams/${team.id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {team.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
                                                        {team.code}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {team.memberCount}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="gap-1">
                                                        <Receipt className="h-3 w-3" />
                                                        {team.expenseCount}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
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
                                                                <Link href={`/admin/teams/${team.id}`}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDeleteClick(team)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Team
                                                            </DropdownMenuItem>
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
                                        <span className="hidden sm:inline ml-1">Previous</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        <span className="hidden sm:inline mr-1">Next</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-12">
                            No teams found
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Team</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{teamToDelete?.name}&quot;?
                            This will remove all members and soft-delete all expenses.
                            This action cannot be undone.
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
                                "Delete Team"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
