/**
 * Lazy-loaded components for code splitting
 * This reduces initial bundle size and improves page load performance
 */
import { lazy } from "react";

// Lazy load PDF generation components (large dependencies: jspdf, html2canvas)
export const LazyPDFGenerator = lazy(() => import("@/components/pdf-generator"));

// Add other heavy components here as needed
// Example: export const LazyChart = lazy(() => import("@/components/chart"));
