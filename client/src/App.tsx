import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import Landing from "@/pages/Landing";
import EventsHome from "@/pages/EventsHome";
import EventDetail from "@/pages/EventDetail";
import MyTickets from "@/pages/MyTickets";
import AdminDashboard from "@/pages/AdminDashboard";
import CreateEvent from "@/pages/CreateEvent";
import ManageEvents from "@/pages/ManageEvents";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={EventsHome} />
          <Route path="/events/:id" component={EventDetail} />
          <Route path="/tickets" component={MyTickets} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/events" component={ManageEvents} />
          <Route path="/admin/events/create" component={CreateEvent} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
