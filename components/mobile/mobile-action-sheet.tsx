"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileActionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actions: {
        label: string;
        onClick: () => void;
        variant?: "default" | "destructive";
        icon?: React.ReactNode;
    }[];
    title?: string;
}

export function MobileActionSheet({
    open,
    onOpenChange,
    actions,
    title,
}: MobileActionSheetProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Action Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2"
                    >
                        {/* Main Actions */}
                        <div className="overflow-hidden rounded-2xl bg-card">
                            {title && (
                                <div className="px-4 py-3 text-center text-sm text-muted-foreground border-b">
                                    {title}
                                </div>
                            )}
                            {actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        action.onClick();
                                        onOpenChange(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-4 text-base font-medium transition-colors flex items-center justify-center gap-2",
                                        index !== actions.length - 1 && "border-b",
                                        action.variant === "destructive"
                                            ? "text-destructive hover:bg-destructive/10"
                                            : "text-foreground hover:bg-accent"
                                    )}
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        {/* Cancel Button */}
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => onOpenChange(false)}
                            className="w-full rounded-2xl bg-card text-base font-semibold h-14"
                        >
                            Cancel
                        </Button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
