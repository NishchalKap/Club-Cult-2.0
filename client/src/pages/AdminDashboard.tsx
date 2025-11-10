import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Calendar, Users, IndianRupee, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import type { Event, Registration } from "@shared/schema";

interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalRegistrations: number;
  totalRevenue: string;
  upcomingEvents: number;
  recentRegistrations: Array<Registration & { event: Event }>;
}

export default function AdminDashboard() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role === "student")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, authLoading, user, toast, navigate]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role !== "student",
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    enabled: isAuthenticated && user?.role !== "student",
  });

  const chartData = events
    .filter(e => e.status === "published")
    .slice(0, 5)
    .map(event => ({
      name: event.title.substring(0, 15) + (event.title.length > 15 ? "..." : ""),
      registrations: event.registeredCount,
    }));

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle?: string;
  }) => (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.firstName || "Admin"}</p>
          </div>
          <Button 
            onClick={() => navigate("/admin/events/create")}
            className="hover-elevate active-elevate-2"
            data-testid="button-create-event"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
            subtitle={`${stats.publishedEvents} published`}
          />
          <StatCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={Users}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue}`}
            icon={IndianRupee}
          />
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={Clock}
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Registration Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Event Registrations</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="registrations" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>No event data available</p>
              </div>
            )}
          </Card>

          {/* Recent Registrations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Registrations</h3>
            {stats.recentRegistrations.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRegistrations.slice(0, 5).map((reg) => (
                  <div 
                    key={reg.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{reg.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {reg.event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reg.registeredAt!), "MMM dd, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>No recent registrations</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start hover-elevate"
              onClick={() => navigate("/admin/events")}
              data-testid="button-manage-events"
            >
              <Calendar className="h-5 w-5 mb-2" />
              <span className="font-semibold">Manage Events</span>
              <span className="text-xs text-muted-foreground">View and edit all events</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start hover-elevate"
              onClick={() => navigate("/admin/registrations")}
              data-testid="button-view-registrations"
            >
              <Users className="h-5 w-5 mb-2" />
              <span className="font-semibold">View Registrations</span>
              <span className="text-xs text-muted-foreground">Manage attendees</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start hover-elevate"
              onClick={() => navigate("/admin/analytics")}
              data-testid="button-analytics"
            >
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="font-semibold">Analytics</span>
              <span className="text-xs text-muted-foreground">View detailed insights</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
