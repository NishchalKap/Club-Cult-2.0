import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, Check, Copy } from "lucide-react";
import type { Event } from "@shared/schema";

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required"),
  venue: z.string().min(1, "Venue is required").max(200),
  eventType: z.enum(["workshop", "concert", "competition", "seminar", "sports", "cultural", "other"]),
  bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  registrationOpens: z.string().min(1, "Registration opens date is required"),
  registrationCloses: z.string().min(1, "Registration closes date is required"),
  eventStarts: z.string().min(1, "Event start date is required"),
  eventEnds: z.string().min(1, "Event end date is required"),
  isPaid: z.boolean(),
  price: z.string().optional(),
  capacity: z.string().optional(),
}).refine((data) => {
  const regCloses = new Date(data.registrationCloses);
  const eventStarts = new Date(data.eventStarts);
  return regCloses <= eventStarts;
}, {
  message: "Registration must close before or when event starts",
  path: ["registrationCloses"],
}).refine((data) => {
  const eventStarts = new Date(data.eventStarts);
  const eventEnds = new Date(data.eventEnds);
  return eventStarts < eventEnds;
}, {
  message: "Event must end after it starts",
  path: ["eventEnds"],
}).refine((data) => {
  if (data.isPaid && (!data.price || parseFloat(data.price) <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Price must be greater than 0 for paid events",
  path: ["price"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function CreateEvent() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role === "student")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create events",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, authLoading, user, toast, navigate]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      venue: "",
      eventType: "other",
      bannerUrl: "",
      registrationOpens: "",
      registrationCloses: "",
      eventStarts: "",
      eventEnds: "",
      isPaid: false,
      price: "",
      capacity: "",
    },
  });

  const isPaid = form.watch("isPaid");

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues & { status: "draft" | "published" }) => {
      const payload = {
        ...data,
        registrationOpens: new Date(data.registrationOpens).toISOString(),
        registrationCloses: new Date(data.registrationCloses).toISOString(),
        eventStarts: new Date(data.eventStarts).toISOString(),
        eventEnds: new Date(data.eventEnds).toISOString(),
        price: data.isPaid && data.price ? data.price : "0",
        capacity: data.capacity ? parseInt(data.capacity) : null,
        bannerUrl: data.bannerUrl || null,
      };
      const response = await apiRequest("POST", "/api/admin/events", payload);
      return response;
    },
    onSuccess: (data) => {
      setCreatedEvent(data);
      setShowSuccess(true);
      form.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Create Event",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (status: "draft" | "published") => {
    form.handleSubmit((data) => {
      createEventMutation.mutate({ ...data, status });
    })();
  };

  const copyEventLink = () => {
    if (createdEvent) {
      const url = `${window.location.origin}/events/${createdEvent.id}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 hover-elevate"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">Fill in the details to create your event</p>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {/* Section 1: Event Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Annual Tech Fest 2025" 
                          {...field}
                          data-testid="input-event-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event in detail..."
                          className="min-h-[120px] resize-y"
                          {...field}
                          data-testid="input-event-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="concert">Concert</SelectItem>
                          <SelectItem value="competition">Competition</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bannerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Image URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="https://example.com/banner.jpg"
                            {...field}
                            data-testid="input-banner-url"
                          />
                          <Button type="button" variant="outline" size="icon" className="flex-shrink-0">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>Recommended size: 1600x900px</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Section 2: Date & Logistics */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Date & Logistics</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Main Auditorium, Building A"
                          {...field}
                          data-testid="input-venue"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationOpens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Opens *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field}
                            data-testid="input-registration-opens"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationCloses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Closes *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field}
                            data-testid="input-registration-closes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventStarts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Starts *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field}
                            data-testid="input-event-starts"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventEnds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Ends *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field}
                            data-testid="input-event-ends"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>

            {/* Section 3: Ticketing */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Ticketing</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Paid Event</FormLabel>
                        <FormDescription>
                          Toggle this if attendees need to pay for registration
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-paid"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isPaid && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="100"
                            {...field}
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Leave empty for unlimited capacity"
                          {...field}
                          data-testid="input-capacity"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of attendees (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit("draft")}
                disabled={createEventMutation.isPending}
                className="flex-1 hover-elevate"
                data-testid="button-save-draft"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit("published")}
                disabled={createEventMutation.isPending}
                className="flex-1 hover-elevate active-elevate-2"
                data-testid="button-publish-event"
              >
                {createEventMutation.isPending ? "Publishing..." : "Publish Event"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
              Success! Your event is live.
            </DialogTitle>
          </DialogHeader>
          
          {createdEvent && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Shareable Link</p>
                <div className="flex gap-2">
                  <Input 
                    value={`${window.location.origin}/events/${createdEvent.id}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyEventLink}
                    className="flex-shrink-0"
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 hover-elevate"
                  onClick={() => navigate(`/events/${createdEvent.id}`)}
                  data-testid="button-view-event"
                >
                  View Event
                </Button>
                <Button
                  className="flex-1 hover-elevate active-elevate-2"
                  onClick={() => navigate("/admin/events")}
                  data-testid="button-manage-events"
                >
                  Manage Events
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
