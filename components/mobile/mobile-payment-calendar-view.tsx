"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobilePaymentCalendar } from "./mobile-payment-calendar";
import { MobilePaymentTimeline } from "./mobile-payment-timeline";
import { getPaymentCalendarData, type CalendarEvent } from "@/app/actions/calendar-data";

interface MobilePaymentCalendarViewProps {
    onBack?: () => void;
}

export function MobilePaymentCalendarView({ onBack }: MobilePaymentCalendarViewProps) {
    const { selectedTeam } = useTeam();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedTeam) return;
            setLoading(true);
            try {
                const result = await getPaymentCalendarData(selectedTeam.id);
                if (!result.error) {
                    setEvents(result.events);
                }
            } catch (error) {
                console.error("Failed to fetch calendar data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedTeam]);

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4 px-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                )}
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h1 className="text-lg font-semibold">Payment Calendar</h1>
                </div>
            </div>

            {/* Selected Date Indicator */}
            {selectedDate && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Selected: {selectedDate.toLocaleDateString()}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDate(null)}
                        className="h-7 text-xs"
                    >
                        Clear
                    </Button>
                </div>
            )}

            {/* Calendar */}
            <MobilePaymentCalendar
                events={events}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                isLoading={loading}
            />

            {/* Timeline Button & Sheet */}
            <MobilePaymentTimeline
                events={events}
                selectedDate={selectedDate}
                isLoading={loading}
            />
        </div>
    );
}
