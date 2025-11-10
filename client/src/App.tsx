import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const Landing = lazy(() => import("@/pages/Landing"));
const EventsHome = lazy(() => import("@/pages/EventsHome"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const MyTickets = lazy(() => import("@/pages/MyTickets"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const CreateEvent = lazy(() => import("@/pages/CreateEvent"));
const ManageEvents = lazy(() => import("@/pages/ManageEvents"));
const EditEvent = lazy(() => import("@/pages/EditEvent"));
const EventRegistrations = lazy(() => import("@/pages/EventRegistrations"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === "club_admin" || user?.role === "super_admin";

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <Switch>
          {isLoading || !isAuthenticated ? (
            <Route path="/" component={Landing} />
          ) : (
            <>
              <Route path="/" component={EventsHome} />
              <Route path="/events/:id" component={EventDetail} />
              <Route path="/tickets" component={MyTickets} />
              {isAdmin && (
                <>
                  <Route path="/admin/dashboard" component={AdminDashboard} />
                  <Route path="/admin/events" component={ManageEvents} />
                  <Route path="/admin/events/create" component={CreateEvent} />
                  <Route path="/admin/events/:id/edit" component={EditEvent} />
                  <Route path="/admin/events/:id/registrations" component={EventRegistrations} />
                </>
              )}
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {!isLoading && isAuthenticated && <Header />}
      <Router />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
