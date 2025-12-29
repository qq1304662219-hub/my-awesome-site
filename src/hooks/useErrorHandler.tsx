
"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";

export const useErrorHandler = () => {
  const handleError = useCallback((error: any, customMessage?: string) => {
    console.error(error);
    const message = customMessage || error?.message || "Something went wrong. Please try again.";
    toast.error(message);
  }, []);

  return { handleError };
};

// Global error boundary for unhandled promise rejections (optional but good for safety)
export function GlobalErrorListener() {
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("Unhandled promise rejection:", event.reason);
            toast.error("An unexpected error occurred.");
        };

        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, []);

    return null;
}
