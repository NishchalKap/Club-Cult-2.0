import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users } from "lucide-react";
import type { Registration } from "@shared/schema";

interface RegistrationWithUser extends Registration {}

export default function EventRegistrations() {
  const params = useParams();
  const eventId = params.id as string;
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role === "student")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view registrations",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, authLoading, user, toast, navigate]);

  const { data: registrations = [], isLoading } = useQuery<RegistrationWithUser[]>({
    queryKey: ["/api/events", eventId, "registrations"],
    enabled: !!eventId && isAuthenticated && user?.role !== "student",
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/events")}
            className="mb-4 hover-elevate"
            data-testid="button-back-to-events"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Events
          </Button>
          <h1 className="text-3xl font-bold mb-2">Registrations</h1>
          <p className="text-muted-foreground">All attendees registered for this event</p>
        </div>

        {registrations.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No registrations yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => (
              <Card key={reg.id} className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{reg.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{reg.email}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono">{reg.ticketId}</span>
                  <span className="text-muted-foreground">{reg.branch}</span>
                  <span className="text-muted-foreground">{reg.year}</span>
                  <span className="font-medium">
                    {reg.paymentStatus === "completed" ? "Paid" : reg.paymentStatus === "pending" ? "Pending" : "Failed"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


