"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/app/actions/calendar-data";

interface PaymentCalendarProps {
    events: CalendarEvent[];
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
    isLoading?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function formatDateKey(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function PaymentCalendar({ events, selectedDate, onSelectDate, isLoading }: PaymentCalendarProps) {
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

    // Calculate calendar days - returns array of weeks (each week is 7 days)
    const calendarWeeks = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const weeks: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

        // Add empty cells for padding at start
        for (let i = 0; i < startPadding; i++) {
            currentWeek.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            currentWeek.push(new Date(year, month, i));

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Add padding at the end if needed
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
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">Payment Calendar</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-center gap-4 mt-4">
                    <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-[200px] text-center">
                        {MONTHS[month]} {year}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* Calendar Table */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {DAYS.map(day => (
                                <th
                                    key={day}
                                    className="text-center text-sm font-semibold text-muted-foreground py-3 px-1"
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
                                            <td key={`empty-${weekIndex}-${dayIndex}`} className="p-1">
                                                <div className="h-16" />
                                            </td>
                                        );
                                    }

                                    const dateKey = formatDateKey(date);
                                    const dayEvents = eventsByDate.get(dateKey);
                                    const hasEvents = dayEvents && dayEvents.count > 0;

                                    return (
                                        <td key={dateKey} className="p-1">
                                            <button
                                                onClick={() => onSelectDate(isSelected(date) ? null : date)}
                                                className={cn(
                                                    "w-full h-16 rounded-xl flex flex-col items-center justify-center relative transition-all",
                                                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                                    isToday(date) && "ring-2 ring-primary",
                                                    isSelected(date) && "bg-primary text-primary-foreground hover:bg-primary/90",
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-base font-semibold",
                                                    isSelected(date) && "text-primary-foreground"
                                                )}>
                                                    {date.getDate()}
                                                </span>

                                                {/* Event Indicators */}
                                                {hasEvents && (
                                                    <div className="flex gap-1 mt-1">
                                                        {dayEvents.hasOverdue && (
                                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        )}
                                                        {dayEvents.hasDue && !dayEvents.hasOverdue && (
                                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                        )}
                                                        {dayEvents.hasPending && (
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        )}
                                                        {dayEvents.hasPaid && (
                                                            <div className="w-2 h-2 rounded-full bg-green-500" />
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

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Overdue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Due</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Paid</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
