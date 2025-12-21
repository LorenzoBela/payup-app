"use client";

import { useState, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Clock,
    Check,
    Plus,
    AlertCircle,
    Timer,
    Calendar,
    ListFilter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format, isToday, isYesterday, isTomorrow } from "date-fns";
import type { CalendarEvent } from "@/app/actions/calendar-data";

interface MobilePaymentTimelineProps {
    events: CalendarEvent[];
    selectedDate: Date | null;
    isLoading?: boolean;
}

const EVENT_CONFIG = {
    expense_created: {
        icon: Plus,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        label: "Added",
    },
    payment_due: {
        icon: Clock,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        label: "Due",
    },
    payment_pending: {
        icon: Timer,
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        label: "Pending",
    },
    payment_made: {
        icon: Check,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Paid",
    },
    payment_verified: {
        icon: Check,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Verified",
    },
};

const EVENTS_PER_PAGE = 15;

function formatEventDate(date: Date): string {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
}

function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function MobilePaymentTimeline({
    events,
    selectedDate,
    isLoading,
}: MobilePaymentTimelineProps) {
    const [currentPage, setCurrentPage] = useState(1);

    // Filter events by selected date if any
    const filteredEvents = useMemo(() => {
        if (!selectedDate) return events;
        const dateKey = formatDateKey(selectedDate);
        return events.filter(e => formatDateKey(new Date(e.date)) === dateKey);
    }, [events, selectedDate]);

    // Reset page when filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [selectedDate]);

    // Pagination
    const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * EVENTS_PER_PAGE;
        return filteredEvents.slice(start, start + EVENTS_PER_PAGE);
    }, [filteredEvents, currentPage]);

    // Group paginated events by date
    const groupedEvents = useMemo(() => {
        const groups = new Map<string, { date: Date; events: CalendarEvent[] }>();

        paginatedEvents.forEach(event => {
            const dateKey = formatDateKey(new Date(event.date));
            const existing = groups.get(dateKey);
            if (existing) {
                existing.events.push(event);
            } else {
                groups.set(dateKey, {
                    date: new Date(event.date),
                    events: [event],
                });
            }
        });

        return Array.from(groups.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [paginatedEvents]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-4"
                >
                    <ListFilter className="w-4 h-4" />
                    View Timeline
                    {filteredEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {filteredEvents.length}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl flex flex-col">
                <SheetHeader className="pb-4 shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Payment Timeline
                    </SheetTitle>
                    {selectedDate && (
                        <Badge variant="secondary" className="w-fit">
                            {format(selectedDate, "MMM d, yyyy")}
                        </Badge>
                    )}
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                        <div className="h-3 bg-muted rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : groupedEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Calendar className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-sm">No events {selectedDate ? "on this day" : "yet"}</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {groupedEvents.map(group => (
                                <div key={formatDateKey(group.date)}>
                                    {/* Date Header */}
                                    <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-2 border-b z-10">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                                            {formatEventDate(group.date)}
                                        </h3>
                                    </div>

                                    {/* Events for this date */}
                                    <div className="space-y-2">
                                        {group.events.map(event => {
                                            const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.expense_created;
                                            const Icon = config.icon;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        "flex gap-3 p-3 rounded-lg border",
                                                        event.isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
                                                    )}
                                                >
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                                        event.isOverdue ? "bg-red-100 dark:bg-red-900/30" : config.bg
                                                    )}>
                                                        {event.isOverdue ? (
                                                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        ) : (
                                                            <Icon className={cn("w-4 h-4", config.color)} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-sm truncate">
                                                                    {event.title}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {event.description}
                                                                </p>
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm font-semibold shrink-0",
                                                                event.status === 'paid' ? "text-green-600" :
                                                                    event.isOverdue ? "text-red-600" : "text-foreground"
                                                            )}>
                                                                ₱{event.amount.toFixed(0)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    "text-[10px] px-1.5 py-0",
                                                                    event.isOverdue && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                )}
                                                            >
                                                                {event.isOverdue ? "Overdue" : config.label}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="shrink-0 border-t px-4 py-3 flex items-center justify-between bg-background -mx-6">
                        <span className="text-xs text-muted-foreground ml-6">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2 mr-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
