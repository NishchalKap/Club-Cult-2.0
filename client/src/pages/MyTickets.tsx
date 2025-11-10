import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, MapPin, Download, QrCode as QrCodeIcon, Ticket } from "lucide-react";
import { format, isPast } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Registration, Event } from "@shared/schema";
import QRCode from "react-qr-code";

interface TicketWithEvent extends Registration {
  event: Event;
}

export default function MyTickets() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithEvent | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        loginWithRedirect();
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast, loginWithRedirect]);

  const { data: tickets = [], isLoading } = useQuery<TicketWithEvent[]>({
    queryKey: ["/api/users/tickets"],
    enabled: isAuthenticated,
  });

  const upcomingTickets = tickets.filter((t) => !isPast(new Date(t.event.eventStarts)));
  const pastTickets = tickets.filter((t) => isPast(new Date(t.event.eventStarts)));

  const TicketCard = ({ ticket }: { ticket: TicketWithEvent }) => {
    const isPastEvent = isPast(new Date(ticket.event.eventStarts));

    return (
      <Card 
        className="p-4 hover-elevate cursor-pointer transition-all"
        onClick={() => setSelectedTicket(ticket)}
        data-testid={`card-ticket-${ticket.id}`}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-muted overflow-hidden">
            {ticket.event.bannerUrl ? (
              <img 
                src={ticket.event.bannerUrl} 
                alt={ticket.event.title}
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
              <h3 className="font-semibold line-clamp-1" data-testid={`text-ticket-title-${ticket.id}`}>
                {ticket.event.title}
              </h3>
              <Badge 
                variant={isPastEvent ? "secondary" : "default"}
                className="flex-shrink-0"
              >
                {isPastEvent ? "Past" : "Upcoming"}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {format(new Date(ticket.event.eventStarts), "MMM dd, yyyy • h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{ticket.event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-mono text-xs">{ticket.ticketId}</span>
              </div>
            </div>

            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTicket(ticket);
                }}
                className="hover-elevate"
                data-testid={`button-view-ticket-${ticket.id}`}
              >
                <QrCodeIcon className="h-3.5 w-3.5 mr-2" />
                View QR Code
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
    <div className="text-center py-16">
      <div className="h-24 w-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Tickets Found</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      <Button onClick={() => navigate("/")} data-testid="button-browse-events">
        Browse Events
      </Button>
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
          <p className="text-muted-foreground">View and manage your event registrations</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingTickets.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({pastTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingTickets.length === 0 ? (
              <EmptyState 
                message="You haven't registered for any upcoming events yet" 
                icon={Calendar}
              />
            ) : (
              upcomingTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastTickets.length === 0 ? (
              <EmptyState 
                message="You don't have any past event tickets" 
                icon={Ticket}
              />
            ) : (
              pastTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket QR Code Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event Ticket</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-4">{selectedTicket.event.title}</h3>
                
                <div className="bg-white p-6 rounded-lg inline-block">
                  <QRCode 
                    value={selectedTicket.ticketId}
                    size={200}
                    data-testid="qr-code"
                  />
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                  <p className="font-mono text-sm font-medium" data-testid="text-ticket-id">
                    {selectedTicket.ticketId}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{selectedTicket.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{selectedTicket.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {format(new Date(selectedTicket.event.eventStarts), "MMM dd, yyyy • h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venue:</span>
                  <span className="font-medium">{selectedTicket.event.venue}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 hover-elevate"
                  onClick={() => window.print()}
                  data-testid="button-download-ticket"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  className="flex-1 hover-elevate active-elevate-2"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
