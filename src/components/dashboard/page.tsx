// Re-export the client-side dashboard page for SPA mode
export { ClientDashboardPage as DashboardPage } from "@/src/components/dashboard/client-page";

// Export the server-side version for SSR mode (legacy)
export { ServerDashboardPage } from "@/src/components/dashboard/server-page";
