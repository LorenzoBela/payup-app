"use client";

import { useEffect, useState } from "react";

/**
 * Client-side hook for mobile detection and responsive utilities
 */
export function useMobile() {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [screenWidth, setScreenWidth] = useState(0);
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            setScreenWidth(width);
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
            setOrientation(width < height ? "portrait" : "landscape");
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        window.addEventListener("orientationchange", checkDevice);

        return () => {
            window.removeEventListener("resize", checkDevice);
            window.removeEventListener("orientationchange", checkDevice);
        };
    }, []);

    return {
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        screenWidth,
        orientation,
        isSmallMobile: screenWidth < 375, // iPhone SE
        isMediumMobile: screenWidth >= 375 && screenWidth < 414,
        isLargeMobile: screenWidth >= 414 && screenWidth < 768,
    };
}

/**
 * Hook to get safe area insets (for iPhone notch, etc.)
 */
export function useSafeArea() {
    const [safeArea, setSafeArea] = useState({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    });

    useEffect(() => {
        const updateSafeArea = () => {
            const style = getComputedStyle(document.documentElement);
            setSafeArea({
                top: parseInt(style.getPropertyValue("--sat") || "0"),
                bottom: parseInt(style.getPropertyValue("--sab") || "0"),
                left: parseInt(style.getPropertyValue("--sal") || "0"),
                right: parseInt(style.getPropertyValue("--sar") || "0"),
            });
        };

        updateSafeArea();
        window.addEventListener("resize", updateSafeArea);

        return () => window.removeEventListener("resize", updateSafeArea);
    }, []);

    return safeArea;
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener("change", handler);

        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return prefersReducedMotion;
}
