"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { Button } from "@/components/ui/button";
import { Loader2, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PaymentCalendar } from "./payment-calendar";
import { PaymentTimelineSidebar } from "./payment-timeline-sidebar";
import { getPaymentCalendarData, type CalendarEvent } from "@/app/actions/calendar-data";

export function PaymentCalendarView() {
    const { selectedTeam } = useTeam();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Fetch calendar data
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

    // Open sheet when a date is selected
    useEffect(() => {
        if (selectedDate) {
            setIsSheetOpen(true);
        }
    }, [selectedDate]);

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        // Optional: clear selection on close if desired, 
        // but keeping it might be better for context unless user explicitly clears.
        // Let's clear it to reset the 'selection' state visual.
        if (!open) {
            setSelectedDate(null);
        }
    };

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header controls */}
            <div className="flex items-center justify-between">
                <div>
                    {/* Left side actions if any */}
                    {selectedDate && (
                        <div className="text-sm text-muted-foreground">
                            Viewing {selectedDate.toLocaleDateString()}
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSheetOpen(true)}
                    className="gap-2"
                >
                    <PanelRightOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">View Timeline</span>
                </Button>
            </div>

            {/* Calendar takes full width now */}
            <div className="w-full overflow-hidden">
                <PaymentCalendar
                    events={events}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    isLoading={loading}
                />
            </div>

            {/* Timeline Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full overflow-hidden">
                    <SheetHeader className="px-6 py-4 border-b shrink-0">
                        <SheetTitle>Payment Timeline</SheetTitle>
                        <div className="text-sm text-muted-foreground">
                            {selectedDate ? `Events for ${selectedDate.toLocaleDateString()}` : "All upcoming events"}
                        </div>
                    </SheetHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                        <PaymentTimelineSidebar
                            events={events}
                            selectedDate={selectedDate}
                            isOpen={true}
                            onToggle={() => setIsSheetOpen(false)}
                            isLoading={loading}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
