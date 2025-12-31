"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    PanelRightClose,
    PanelRightOpen,
    Clock,
    Check,
    Plus,
    AlertCircle,
    Timer,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format, isToday, isYesterday, isTomorrow } from "date-fns";
import type { CalendarEvent } from "@/app/actions/calendar-data";

interface PaymentTimelineSidebarProps {
    events: CalendarEvent[];
    selectedDate: Date | null;
    isOpen: boolean;
    onToggle: () => void;
    isLoading?: boolean;
}

const EVENT_CONFIG = {
    expense_created: {
        icon: Plus,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        label: "Expense Added",
    },
    payment_due: {
        icon: Clock,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        label: "Payment Due",
    },
    payment_pending: {
        icon: Timer,
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        label: "Awaiting Verification",
    },
    payment_made: {
        icon: Check,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Payment Completed",
    },
    payment_verified: {
        icon: Check,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Payment Verified",
    },
};

const EVENTS_PER_PAGE = 10;

function formatEventDate(date: Date): string {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d, yyyy");
}

function formatDateKey(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function PaymentTimelineSidebar({
    events,
    selectedDate,
    isOpen,
    onToggle,
    isLoading,
}: PaymentTimelineSidebarProps) {
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

        // Sort groups by date (newest first)
        return Array.from(groups.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [paginatedEvents]);

    if (!isOpen) {
        return null;
    }

    // Placeholder for TimelineEventCard and todaysEvents, as they were not fully defined in the instruction.
    // Assuming TimelineEventCard is a component that takes an event prop.
    const TimelineEventCard = ({ event }: { event: CalendarEvent }) => {
        const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.expense_created;
        const Icon = config.icon;

        return (
            <div
                key={event.id}
                className={cn(
                    "flex gap-2.5 p-2.5 rounded-lg border transition-colors",
                    "hover:bg-muted/50",
                    event.isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
                )}
            >
                {/* Icon */}
                <div className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                    event.isOverdue ? "bg-red-100 dark:bg-red-900/30" : config.bg
                )}>
                    {event.isOverdue ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    ) : (
                        <Icon className={cn("w-3.5 h-3.5", config.color)} />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                        <p className="font-medium text-sm truncate leading-tight">
                            {event.title}
                        </p>
                        <span className={cn(
                            "text-sm font-semibold shrink-0",
                            event.status === 'paid' ? "text-green-600" :
                                event.isOverdue ? "text-red-600" : "text-foreground"
                        )}>
                            ₱{event.amount.toFixed(0)}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {event.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-[9px] px-1 py-0 h-4",
                                event.isOverdue && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}
                        >
                            {event.isOverdue ? "Overdue" : config.label}
                        </Badge>
                    </div>
                </div>
            </div>
        );
    };

    const todaysEvents = useMemo(() => {
        const todayKey = formatDateKey(new Date());
        return events.filter(e => formatDateKey(new Date(e.date)) === todayKey);
    }, [events]);


    return (
        <div className="flex flex-col w-full bg-background">
            {!selectedDate && (
                <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">Timeline</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {events.length} Upcoming
                    </Badge>
                </div>
            )}

            <div className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Today's Events */}
                    {todaysEvents.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Today
                            </h4>
                            <div className="space-y-3">
                                {todaysEvents.map(event => (
                                    <TimelineEventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="space-y-4">
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
                                    <div className="sticky top-0 bg-card/95 backdrop-blur-sm py-1.5 mb-2 border-b z-10">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                                                        "flex gap-2.5 p-2.5 rounded-lg border transition-colors",
                                                        "hover:bg-muted/50",
                                                        event.isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
                                                    )}
                                                >
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                                                        event.isOverdue ? "bg-red-100 dark:bg-red-900/30" : config.bg
                                                    )}>
                                                        {event.isOverdue ? (
                                                            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                        ) : (
                                                            <Icon className={cn("w-3.5 h-3.5", config.color)} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <p className="font-medium text-sm truncate leading-tight">
                                                                {event.title}
                                                            </p>
                                                            <span className={cn(
                                                                "text-sm font-semibold shrink-0",
                                                                event.status === 'paid' ? "text-green-600" :
                                                                    event.isOverdue ? "text-red-600" : "text-foreground"
                                                            )}>
                                                                ₱{event.amount.toFixed(0)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {event.description}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    "text-[9px] px-1 py-0 h-4",
                                                                    event.isOverdue && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                )}
                                                            >
                                                                {event.isOverdue ? "Overdue" : config.label}
                                                            </Badge>
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
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between bg-card">
                    <span className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
