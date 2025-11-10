import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
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
  status: z.enum(["draft", "published"]),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EditEvent() {
  const params = useParams();
  const eventId = params.id as string;
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role === "student")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit events",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, authLoading, user, toast, navigate]);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId && isAuthenticated && user?.role !== "student",
  });

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
      status: "draft",
    },
    values: event
      ? {
          title: event.title,
          description: event.description,
          venue: event.venue,
          eventType: event.eventType ?? "other",
          bannerUrl: event.bannerUrl ?? "",
          registrationOpens: new Date(event.registrationOpens).toISOString().slice(0, 16),
          registrationCloses: new Date(event.registrationCloses).toISOString().slice(0, 16),
          eventStarts: new Date(event.eventStarts).toISOString().slice(0, 16),
          eventEnds: new Date(event.eventEnds).toISOString().slice(0, 16),
          isPaid: !!event.isPaid,
          price: event.price ? String(event.price) : "",
          capacity: event.capacity ? String(event.capacity) : "",
          status: event.status,
        }
      : undefined,
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const payload: Record<string, unknown> = {
        ...data,
        registrationOpens: new Date(data.registrationOpens).toISOString(),
        registrationCloses: new Date(data.registrationCloses).toISOString(),
        eventStarts: new Date(data.eventStarts).toISOString(),
        eventEnds: new Date(data.eventEnds).toISOString(),
        price: data.isPaid && data.price ? data.price : "0",
        capacity: data.capacity ? parseInt(data.capacity) : null,
        bannerUrl: data.bannerUrl || null,
      };
      const updated = await apiRequest<Event>("PATCH", `/api/admin/events/${eventId}`, payload);
      return updated;
    },
    onSuccess: () => {
      toast({
        title: "Event Updated",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      navigate("/admin/events");
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
        title: "Failed to Update Event",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
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
          <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
          <p className="text-muted-foreground">Update details and publish when ready</p>
        </div>

        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((data) => updateEventMutation.mutate(data))}
          >
            <Card className="p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual Tech Fest 2025" {...field} />
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
                        <Textarea placeholder="Describe your event..." className="min-h-[120px]" {...field} />
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
                          <SelectTrigger>
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
                        <Input placeholder="https://example.com/banner.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Auditorium" {...field} />
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
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Paid Event</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isPaid") && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
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
                        <Input type="number" placeholder="Leave empty for unlimited capacity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={updateEventMutation.isPending} className="flex-1 hover-elevate active-elevate-2">
                {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}


