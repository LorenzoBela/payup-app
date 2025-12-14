"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllTeams, getTeamDeletionPreview, hardDeleteTeam } from "@/app/actions/admin";
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
    AlertTriangle,
    Loader2,
    Search,
    Building2,
    Users,
    Receipt,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    Trash2,
    Activity,
    CreditCard
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

interface DeletionPreview {
    teamName: string;
    teamCode: string;
    memberCount: number;
    members: { id: string; name: string; email: string }[];
    expenseCount: number;
    totalVolume: number;
    settlements: {
        pending: number;
        unconfirmed: number;
        paid: number;
        total: number;
    };
    activityLogCount: number;
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
    const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [confirmName, setConfirmName] = useState("");

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

    const handleDeleteClick = async (team: Team) => {
        setTeamToDelete(team);
        setDeleteDialogOpen(true);
        setConfirmName("");
        setDeletionPreview(null);
        setIsLoadingPreview(true);

        try {
            const result = await getTeamDeletionPreview(team.id);
            if (result.success && result.preview) {
                setDeletionPreview(result.preview);
            } else {
                toast.error(result.error || "Failed to load deletion preview");
            }
        } catch {
            toast.error("Failed to load deletion preview");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!teamToDelete || !deletionPreview) return;
        if (confirmName !== deletionPreview.teamName) {
            toast.error("Team name does not match");
            return;
        }

        setIsDeleting(true);
        try {
            const result = await hardDeleteTeam(teamToDelete.id, confirmName);
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
            setDeletionPreview(null);
            setConfirmName("");
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
            <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setDeleteDialogOpen(false);
                    setTeamToDelete(null);
                    setDeletionPreview(null);
                    setConfirmName("");
                }
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Permanently Delete Team
                        </DialogTitle>
                        <DialogDescription>
                            This action is <strong className="text-destructive">irreversible</strong>. All team data will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingPreview ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : deletionPreview ? (
                        <div className="space-y-4">
                            {/* Data to be deleted */}
                            <div className="rounded-lg border bg-destructive/5 p-4 space-y-3">
                                <p className="font-medium text-sm">The following data will be permanently deleted:</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span><strong>{deletionPreview.memberCount}</strong> members</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <span><strong>{deletionPreview.expenseCount}</strong> expenses</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span><strong>{deletionPreview.settlements.total}</strong> settlements</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                        <span><strong>{deletionPreview.activityLogCount}</strong> logs</span>
                                    </div>
                                </div>
                                {deletionPreview.totalVolume > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm">
                                            Total expense volume: <strong className="text-destructive">
                                                ₱{deletionPreview.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </strong>
                                        </p>
                                    </div>
                                )}
                                {deletionPreview.settlements.pending > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-amber-600">
                                            ⚠️ <strong>{deletionPreview.settlements.pending}</strong> pending settlements will be lost
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirmation input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Type <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-destructive">{deletionPreview.teamName}</code> to confirm:
                                </label>
                                <Input
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder="Enter team name"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">
                            Failed to load deletion preview
                        </p>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting || !deletionPreview || confirmName !== deletionPreview?.teamName}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Permanently Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
