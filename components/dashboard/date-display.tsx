"use client";

import { useEffect, useState } from "react";

export function DateDisplay() {
    const [date, setDate] = useState<string>("");
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };

            setDate(now.toLocaleDateString(undefined, dateOptions));
            setTime(now.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }));
        };

        // Initial update
        updateDateTime();

        // Update every second
        const interval = setInterval(updateDateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!date) {
        return null; // Or a skeleton
    }

    return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{date}</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="tabular-nums font-medium">{time}</span>
        </div>
    );
}
