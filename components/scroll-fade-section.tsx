"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollFadeSectionProps {
    children: ReactNode;
    className?: string;
    id?: string;
}

export function ScrollFadeSection({ children, className, id }: ScrollFadeSectionProps) {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // Fade in when entering view, fade out when leaving view
    // [0, 0.2] -> opacity 0 to 1 (Fade In)
    // [0.8, 1] -> opacity 1 to 0 (Fade Out)
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0.95, 1, 1, 0.95]);

    return (
        <motion.section
            ref={ref}
            id={id}
            style={{ opacity, scale }}
            className={className}
        >
            {children}
        </motion.section>
    );
}
