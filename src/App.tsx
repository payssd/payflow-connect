import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Subscription from "./pages/Subscription";
import SubscriptionCallback from "./pages/SubscriptionCallback";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import PayrollRuns from "./pages/PayrollRuns";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import ExpenseReports from "./pages/ExpenseReports";
import ExpenseBudgets from "./pages/ExpenseBudgets";
import ExpenseAnalytics from "./pages/ExpenseAnalytics";
import PaymentSettings from "./pages/PaymentSettings";
import OrganizationSettings from "./pages/OrganizationSettings";
import TeamSettings from "./pages/TeamSettings";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PublicInvoice from "./pages/PublicInvoice";
import AcceptInvitation from "./pages/AcceptInvitation";
import InvoiceAging from "./pages/InvoiceAging";
import SubscriptionManagement from "./pages/SubscriptionManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/invoice/:token" element={<PublicInvoice />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              
              {/* Semi-protected routes (need auth but not org) */}
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/subscription/callback" element={<SubscriptionCallback />} />
              
              {/* Protected routes with dashboard layout */}
              <Route
                element={
                  <AuthGuard requireOrganization>
                    <ErrorBoundary>
                      <DashboardLayout />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Payroll routes */}
                <Route path="/payroll/employees" element={<Employees />} />
                <Route path="/payroll/employees/:id" element={<Employees />} />
                <Route path="/payroll/runs" element={<PayrollRuns />} />
                <Route path="/payroll/runs/:id" element={<PayrollRuns />} />
                
                {/* Invoice routes */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<Invoices />} />
                
                {/* Expenses */}
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/expenses/budgets" element={<ExpenseBudgets />} />
                
                {/* Reports */}
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/expenses" element={<ExpenseReports />} />
                <Route path="/reports/analytics" element={<ExpenseAnalytics />} />
                <Route path="/reports/aging" element={<InvoiceAging />} />
                <Route path="/reports/payroll" element={<Reports />} />
                <Route path="/reports/invoices" element={<Reports />} />
                <Route path="/reports/invoices" element={<Reports />} />
                
                {/* Settings */}
                <Route path="/settings/organization" element={<OrganizationSettings />} />
                <Route path="/settings/gateways" element={<PaymentSettings />} />
                <Route path="/settings/subscription" element={<SubscriptionManagement />} />
                <Route path="/settings/team" element={<TeamSettings />} />
                <Route path="/settings/profile" element={<ProfileSettings />} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
</ErrorBoundary>
);

export default App;
