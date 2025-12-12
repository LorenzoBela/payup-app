"use client";

import { useEffect, useState } from "react";

export function DateDisplay() {
    const [date, setDate] = useState<string>("");

    useEffect(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        setDate(now.toLocaleDateString(undefined, options));
    }, []);

    if (!date) {
        return null; // Or a skeleton
    }

    return (
        <div className="text-sm text-muted-foreground">
            {date}
        </div>
    );
}
