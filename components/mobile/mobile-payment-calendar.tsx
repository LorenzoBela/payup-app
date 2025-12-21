"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/app/actions/calendar-data";

interface MobilePaymentCalendarProps {
    events: CalendarEvent[];
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
    isLoading?: boolean;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function MobilePaymentCalendar({ events, selectedDate, onSelectDate, isLoading }: MobilePaymentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Group events by date
    const eventsByDate = useMemo(() => {
        const map = new Map<string, {
            hasOverdue: boolean;
            hasPending: boolean;
            hasPaid: boolean;
            hasDue: boolean;
            count: number;
        }>();

        events.forEach(event => {
            const dateKey = formatDateKey(new Date(event.date));
            const existing = map.get(dateKey) || {
                hasOverdue: false,
                hasPending: false,
                hasPaid: false,
                hasDue: false,
                count: 0,
            };

            existing.count++;
            if (event.isOverdue) existing.hasOverdue = true;
            if (event.type === 'payment_due') existing.hasDue = true;
            if (event.type === 'payment_pending') existing.hasPending = true;
            if (event.type === 'payment_made' || event.status === 'paid') existing.hasPaid = true;

            map.set(dateKey, existing);
        });

        return map;
    }, [events]);

    // Calculate calendar weeks
    const calendarWeeks = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const weeks: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

        for (let i = 0; i < startPadding; i++) {
            currentWeek.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            currentWeek.push(new Date(year, month, i));

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }

        return weeks;
    }, [year, month]);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        onSelectDate(new Date());
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return formatDateKey(date) === formatDateKey(today);
    };

    const isSelected = (date: Date) => {
        return selectedDate && formatDateKey(date) === formatDateKey(selectedDate);
    };

    return (
        <Card>
            <CardHeader className="pb-2 px-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Calendar
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={goToToday} className="h-7 text-xs">
                        Today
                    </Button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mt-2">
                    <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-base font-semibold">
                        {MONTHS[month]} {year}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="px-2 pb-3">
                {/* Calendar Table */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {DAYS.map((day, i) => (
                                <th
                                    key={i}
                                    className="text-center text-xs font-medium text-muted-foreground py-2"
                                >
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {calendarWeeks.map((week, weekIndex) => (
                            <tr key={weekIndex}>
                                {week.map((date, dayIndex) => {
                                    if (!date) {
                                        return (
                                            <td key={`empty-${weekIndex}-${dayIndex}`} className="p-0.5">
                                                <div className="h-10" />
                                            </td>
                                        );
                                    }

                                    const dateKey = formatDateKey(date);
                                    const dayEvents = eventsByDate.get(dateKey);
                                    const hasEvents = dayEvents && dayEvents.count > 0;

                                    return (
                                        <td key={dateKey} className="p-0.5">
                                            <button
                                                onClick={() => onSelectDate(isSelected(date) ? null : date)}
                                                className={cn(
                                                    "w-full h-10 rounded-lg flex flex-col items-center justify-center transition-all",
                                                    "active:scale-95",
                                                    isToday(date) && "ring-2 ring-primary",
                                                    isSelected(date) && "bg-primary text-primary-foreground",
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    isSelected(date) && "text-primary-foreground"
                                                )}>
                                                    {date.getDate()}
                                                </span>

                                                {/* Event Indicators */}
                                                {hasEvents && (
                                                    <div className="flex gap-0.5 mt-0.5">
                                                        {dayEvents.hasOverdue && (
                                                            <div className="w-1 h-1 rounded-full bg-red-500" />
                                                        )}
                                                        {dayEvents.hasDue && !dayEvents.hasOverdue && (
                                                            <div className="w-1 h-1 rounded-full bg-orange-500" />
                                                        )}
                                                        {dayEvents.hasPending && (
                                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                        )}
                                                        {dayEvents.hasPaid && (
                                                            <div className="w-1 h-1 rounded-full bg-green-500" />
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Compact Legend */}
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground justify-center">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Overdue</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Due</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Paid</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
