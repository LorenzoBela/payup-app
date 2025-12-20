"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
    Building2,
    Search,
    ChevronRight,
    Users,
    Receipt,
    Calendar,
    Trash2,
    Loader2,
    ChevronLeft,
    AlertTriangle,
    DollarSign,
    Activity
} from "lucide-react";
import { getAllTeams, getTeamDetails, getTeamDeletionPreview, hardDeleteTeam } from "@/app/actions/admin";

interface TeamData {
    id: string;
    name: string;
    code: string;
    created_at: Date;
    memberCount: number;
    expenseCount: number;
}

interface TeamDetailsData {
    id: string;
    name: string;
    code: string;
    created_at: Date;
    memberCount: number;
    expenseCount: number;
    activityCount: number;
    totalExpenseVolume: number;
    members: Array<{
        userId: string;
        userName: string;
        userEmail: string;
        teamRole: string;
        joinedAt: Date;
    }>;
    recentExpenses: Array<{
        id: string;
        amount: number;
        description: string;
        category: string;
        created_at: Date;
    }>;
}

interface DeletionPreview {
    teamName: string;
    teamCode: string;
    memberCount: number;
    members: Array<{ id: string; name: string; email: string }>;
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

export function MobileAdminTeams() {
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<TeamData[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<TeamDetailsData | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<TeamData | null>(null);
    const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [confirmName, setConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTeams = async () => {
        setIsLoading(true);
        try {
            const result = await getAllTeams({ page, limit: 20 });
            setTeams(result.teams);
            setFilteredTeams(result.teams);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
            toast.error("Failed to load teams");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [page]);

    useEffect(() => {
        if (search.trim() === "") {
            setFilteredTeams(teams);
        } else {
            const filtered = teams.filter(
                (t) =>
                    t.name.toLowerCase().includes(search.toLowerCase()) ||
                    t.code.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredTeams(filtered);
        }
    }, [search, teams]);

    const handleViewTeam = async (team: TeamData) => {
        setLoadingDetails(true);
        setDetailsOpen(true);
        try {
            const details = await getTeamDetails(team.id);
            if (details) {
                setSelectedTeam(details as TeamDetailsData);
            }
        } catch (error) {
            console.error("Failed to fetch team details:", error);
            toast.error("Failed to load team details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleOpenDeleteDialog = async (team: TeamData) => {
        setTeamToDelete(team);
        setLoadingPreview(true);
        setDeleteDialogOpen(true);
        try {
            const result = await getTeamDeletionPreview(team.id);
            if (result.success && result.preview) {
                setDeletionPreview(result.preview);
            }
        } catch (error) {
            console.error("Failed to fetch deletion preview:", error);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete || confirmName !== teamToDelete.name) {
            toast.error("Please enter the exact team name to confirm");
            return;
        }

        setIsDeleting(true);
        try {
            const result = await hardDeleteTeam(teamToDelete.id, confirmName);
            if (result.success) {
                toast.success(result.message);
                setDeleteDialogOpen(false);
                setTeamToDelete(null);
                setDeletionPreview(null);
                setConfirmName("");
                setDetailsOpen(false);
                fetchTeams();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to delete team");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading && teams.length === 0) {
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
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Teams</h1>
                    <p className="text-sm text-muted-foreground">{teams.length} total teams</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Team Cards */}
            <div className="space-y-2">
                {filteredTeams.map((team) => (
                    <Card
                        key={team.id}
                        className="overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                        onClick={() => handleViewTeam(team)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                    <Building2 className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-semibold truncate">{team.name}</p>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {team.code}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {team.memberCount} members
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Receipt className="w-3 h-3" />
                                            {team.expenseCount} expenses
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Created {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                                    </p>
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

            {/* Team Details Sheet */}
            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
                    {loadingDetails ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : selectedTeam ? (
                        <>
                            <SheetHeader className="text-left pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                        <Building2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-lg">{selectedTeam.name}</SheetTitle>
                                        <SheetDescription className="flex items-center gap-2">
                                            Code: <Badge variant="outline">{selectedTeam.code}</Badge>
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="space-y-4 pb-6">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Card>
                                        <CardContent className="p-3 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-lg font-bold">{selectedTeam.memberCount}</p>
                                                <p className="text-xs text-muted-foreground">Members</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-3 flex items-center gap-2">
                                            <Receipt className="w-4 h-4 text-purple-500" />
                                            <div>
                                                <p className="text-lg font-bold">{selectedTeam.expenseCount}</p>
                                                <p className="text-xs text-muted-foreground">Expenses</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-3 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-green-500" />
                                            <div>
                                                <p className="text-lg font-bold">₱{(selectedTeam.totalExpenseVolume / 1000).toFixed(1)}k</p>
                                                <p className="text-xs text-muted-foreground">Volume</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-3 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-orange-500" />
                                            <div>
                                                <p className="text-lg font-bold">{selectedTeam.activityCount}</p>
                                                <p className="text-xs text-muted-foreground">Activities</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Members */}
                                {selectedTeam.members.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Members ({selectedTeam.members.length})</h3>
                                        <Card>
                                            <CardContent className="p-3 space-y-2">
                                                {selectedTeam.members.map((member) => (
                                                    <div key={member.userId} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                                                        <div>
                                                            <p className="font-medium">{member.userName}</p>
                                                            <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {member.teamRole}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Recent Expenses */}
                                {selectedTeam.recentExpenses.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Recent Expenses</h3>
                                        <Card>
                                            <CardContent className="p-3 space-y-2">
                                                {selectedTeam.recentExpenses.slice(0, 5).map((expense) => (
                                                    <div key={expense.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                                                        <div>
                                                            <p className="font-medium truncate max-w-[180px]">{expense.description}</p>
                                                            <p className="text-xs text-muted-foreground">{expense.category}</p>
                                                        </div>
                                                        <span className="font-semibold">₱{expense.amount.toFixed(0)}</span>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Delete Button */}
                                <Button
                                    variant="destructive"
                                    className="w-full gap-2"
                                    onClick={() => handleOpenDeleteDialog(selectedTeam as unknown as TeamData)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Team
                                </Button>
                            </div>
                        </>
                    ) : null}
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Team?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{teamToDelete?.name}</strong> and ALL related data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {loadingPreview ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : deletionPreview && (
                        <div className="space-y-3 py-3">
                            <div className="bg-destructive/10 rounded-lg p-3 space-y-2 text-sm">
                                <p className="font-medium text-destructive">⚠️ The following will be deleted:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• {deletionPreview.memberCount} team members</li>
                                    <li>• {deletionPreview.expenseCount} expenses (₱{deletionPreview.totalVolume.toFixed(0)} total)</li>
                                    <li>• {deletionPreview.settlements.total} settlements</li>
                                    <li>• {deletionPreview.activityLogCount} activity logs</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Type "{teamToDelete?.name}" to confirm:
                                </label>
                                <Input
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder="Enter team name"
                                />
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setConfirmName("");
                            setDeletionPreview(null);
                        }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTeam}
                            disabled={isDeleting || confirmName !== teamToDelete?.name}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Permanently"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
