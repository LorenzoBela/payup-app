"use client";

import { useEffect, useRef, useState } from "react";

interface SwipeInput {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number; // Minimum distance for swipe (px)
    velocityThreshold?: number; // Minimum velocity for swipe (px/ms)
}

interface TouchPosition {
    x: number;
    y: number;
    time: number;
}

/**
 * Hook for detecting swipe gestures on touch devices
 */
export function useSwipe(input: SwipeInput) {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
        velocityThreshold = 0.3,
    } = input;

    const touchStartRef = useRef<TouchPosition | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };
            setIsSwiping(false);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

            // Mark as swiping if movement exceeds threshold
            if (deltaX > 10 || deltaY > 10) {
                setIsSwiping(true);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const deltaTime = Date.now() - touchStartRef.current.time;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const velocity = Math.max(absX, absY) / deltaTime;

            // Horizontal swipe
            if (absX > absY && absX > threshold && velocity > velocityThreshold) {
                if (deltaX > 0) {
                    onSwipeRight?.();
                } else {
                    onSwipeLeft?.();
                }
            }
            // Vertical swipe
            else if (absY > absX && absY > threshold && velocity > velocityThreshold) {
                if (deltaY > 0) {
                    onSwipeDown?.();
                } else {
                    onSwipeUp?.();
                }
            }

            touchStartRef.current = null;
            setIsSwiping(false);
        };

        document.addEventListener("touchstart", handleTouchStart);
        document.addEventListener("touchmove", handleTouchMove);
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

    return { isSwiping };
}

/**
 * Hook for swipe gestures on a specific element
 */
export function useElementSwipe(input: SwipeInput) {
    const elementRef = useRef<HTMLElement>(null);
    const touchStartRef = useRef<TouchPosition | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);

    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
        velocityThreshold = 0.3,
    } = input;

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };
            setIsSwiping(false);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

            if (deltaX > 10 || deltaY > 10) {
                setIsSwiping(true);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const deltaTime = Date.now() - touchStartRef.current.time;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const velocity = Math.max(absX, absY) / deltaTime;

            if (absX > absY && absX > threshold && velocity > velocityThreshold) {
                if (deltaX > 0) {
                    onSwipeRight?.();
                } else {
                    onSwipeLeft?.();
                }
            } else if (absY > absX && absY > threshold && velocity > velocityThreshold) {
                if (deltaY > 0) {
                    onSwipeDown?.();
                } else {
                    onSwipeUp?.();
                }
            }

            touchStartRef.current = null;
            setIsSwiping(false);
        };

        element.addEventListener("touchstart", handleTouchStart);
        element.addEventListener("touchmove", handleTouchMove);
        element.addEventListener("touchend", handleTouchEnd);

        return () => {
            element.removeEventListener("touchstart", handleTouchStart);
            element.removeEventListener("touchmove", handleTouchMove);
            element.removeEventListener("touchend", handleTouchEnd);
        };
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

    return { elementRef, isSwiping };
}
