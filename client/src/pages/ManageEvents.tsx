import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Calendar, Users, IndianRupee, Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

export default function ManageEvents() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role === "student")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage events",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, authLoading, user, toast, navigate]);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    enabled: isAuthenticated && user?.role !== "student",
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/admin/events/${eventId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setDeleteEventId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        // Handled globally by axios interceptor
        return;
      }
      toast({
        title: "Failed to Delete Event",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const publishedEvents = events.filter(e => e.status === "published");
  const draftEvents = events.filter(e => e.status === "draft");
  const pastEvents = events.filter(e => new Date(e.eventStarts) < new Date());

  const filterEvents = (eventsList: Event[]) => {
    if (!searchQuery) return eventsList;
    return eventsList.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="p-4 hover-elevate" data-testid={`card-admin-event-${event.id}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-32 h-24 rounded-lg bg-muted overflow-hidden">
          {event.bannerUrl ? (
            <img 
              src={event.bannerUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-1 mb-1">{event.title}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {event.eventType}
                </Badge>
                {event.status === "draft" && (
                  <Badge variant="outline" className="text-xs">Draft</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {format(new Date(event.eventStarts), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {event.registeredCount}{event.capacity ? `/${event.capacity}` : ""}
              </span>
            </div>
            {event.isPaid && (
              <div className="flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
                <span>₹{event.price}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/admin/events/${event.id}/edit`)}
              className="hover-elevate"
              data-testid={`button-edit-${event.id}`}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/admin/events/${event.id}/registrations`)}
              className="hover-elevate"
              data-testid={`button-registrations-${event.id}`}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Registrations
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteEventId(event.id)}
              className="hover-elevate text-destructive hover:text-destructive"
              data-testid={`button-delete-${event.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-16">
      <div className="h-24 w-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
        <Calendar className="h-12 w-12 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Events</h1>
              <p className="text-muted-foreground">View and manage all your events</p>
            </div>
            <Button
              onClick={() => navigate("/admin/events/create")}
              className="hover-elevate active-elevate-2"
              data-testid="button-create-new"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="published" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="published" data-testid="tab-published">
              Published ({publishedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="draft" data-testid="tab-draft">
              Drafts ({draftEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="published" className="space-y-4">
            {filterEvents(publishedEvents).length === 0 ? (
              <EmptyState message="No published events found" />
            ) : (
              filterEvents(publishedEvents).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            {filterEvents(draftEvents).length === 0 ? (
              <EmptyState message="No draft events found" />
            ) : (
              filterEvents(draftEvents).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {filterEvents(pastEvents).length === 0 ? (
              <EmptyState message="No past events found" />
            ) : (
              filterEvents(pastEvents).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and all registrations will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteEventId(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteEventId && deleteMutation.mutate(deleteEventId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
