import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, IndianRupee } from "lucide-react";
import type { Event } from "@shared/schema";
import { format } from "date-fns";

interface EventCardProps {
  event: Event;
  onRegister?: () => void;
}

export function EventCard({ event, onRegister }: EventCardProps) {
  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;
  const isSoldOut = spotsLeft !== null && spotsLeft <= 0;
  const isClosingSoon = spotsLeft !== null && spotsLeft < 20;

  return (
    <Card 
      className="overflow-hidden hover-elevate transition-all duration-200 group cursor-pointer"
      data-testid={`card-event-${event.id}`}
    >
      {/* Event Banner */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {event.bannerUrl ? (
          <img 
            src={event.bannerUrl} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {!event.isPaid && (
            <Badge className="bg-accent text-accent-foreground font-semibold shadow-lg">
              Free
            </Badge>
          )}
          {isSoldOut && (
            <Badge variant="destructive" className="font-semibold shadow-lg">
              Sold Out
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-xl font-semibold line-clamp-2 mb-1" data-testid={`text-event-title-${event.id}`}>
            {event.title}
          </h3>
          {event.eventType && (
            <Badge variant="secondary" className="text-xs">
              {event.eventType}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(event.eventStarts), "MMM dd, yyyy • h:mm a")}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          {spotsLeft !== null && !isSoldOut && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className={isClosingSoon ? "text-destructive font-medium" : ""}>
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 font-semibold text-lg">
            {event.isPaid ? (
              <>
                <IndianRupee className="h-4 w-4" />
                <span>{event.price}</span>
              </>
            ) : (
              <span className="text-accent">Free Event</span>
            )}
          </div>
          
          <Button
            size="sm"
            onClick={onRegister}
            disabled={isSoldOut}
            className="hover-elevate active-elevate-2"
            data-testid={`button-register-${event.id}`}
          >
            {isSoldOut ? "Sold Out" : "Register"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
