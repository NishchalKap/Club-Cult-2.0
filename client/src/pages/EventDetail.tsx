import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isPast, isBefore } from "date-fns";
import { Calendar, MapPin, Users, Clock, IndianRupee, Share2, ArrowLeft, Check } from "lucide-react";
import type { Event, Registration } from "@shared/schema";

const registrationFormSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  branch: z.string().min(1, "Branch is required").max(50),
  year: z.string().min(1, "Year is required").max(10),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export default function EventDetail() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<Registration | null>(null);

  const eventId = params.id as string;

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: userRegistration } = useQuery<Registration | null>({
    queryKey: ["/api/events", eventId, "my-registration"],
    enabled: !!eventId && isAuthenticated,
  });

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      phone: user?.phone || "",
      branch: user?.branch || "",
      year: user?.year || "",
      acceptTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormValues) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/register`, {
        name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "User",
        email: user?.email || "",
        phone: data.phone,
        branch: data.branch,
        year: data.year,
      });
      return response;
    },
    onSuccess: (data) => {
      setRegistrationData(data);
      setShowRegistrationForm(false);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "my-registration"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/tickets"] });
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
        title: "Registration Failed",
        description: error.message || "Failed to register for event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to register for events",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    setShowRegistrationForm(true);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (eventLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full h-96" />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;
  const isSoldOut = spotsLeft !== null && spotsLeft <= 0;
  const registrationClosed = isPast(new Date(event.registrationCloses));
  const isRegistered = !!userRegistration;
  const canRegister = !isSoldOut && !registrationClosed && !isRegistered && event.status === "published";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-96 bg-muted overflow-hidden">
        {event.bannerUrl ? (
          <>
            <img 
              src={event.bannerUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20" />
        )}
        
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/")}
            className="backdrop-blur-lg bg-background/80 hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-3" data-testid="text-event-title">
                    {event.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {event.eventType && (
                      <Badge variant="secondary">{event.eventType}</Badge>
                    )}
                    {!event.isPaid && (
                      <Badge className="bg-accent text-accent-foreground">Free</Badge>
                    )}
                    {isRegistered && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Check className="h-3 w-3 mr-1" />
                        Registered
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="hover-elevate"
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-6 space-y-4 sticky top-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.eventStarts), "EEEE, MMMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.eventStarts), "h:mm a")} - {format(new Date(event.eventEnds), "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>

                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-sm text-muted-foreground">
                        {event.registeredCount} / {event.capacity} registered
                        {spotsLeft !== null && spotsLeft > 0 && (
                          <span className={spotsLeft < 20 ? "text-destructive font-medium ml-1" : "ml-1"}>
                            ({spotsLeft} spots left)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.registrationCloses), "MMM dd, yyyy • h:mm a")}
                    </p>
                  </div>
                </div>

                {event.isPaid && (
                  <div className="flex items-start gap-3">
                    <IndianRupee className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-xl font-bold text-primary">₹{event.price}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                {isRegistered ? (
                  <Button
                    className="w-full hover-elevate active-elevate-2"
                    onClick={() => navigate("/tickets")}
                    data-testid="button-view-ticket"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    View Ticket
                  </Button>
                ) : canRegister ? (
                  <Button
                    className="w-full hover-elevate active-elevate-2"
                    onClick={handleRegisterClick}
                    data-testid="button-register-now"
                  >
                    Register Now
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled
                    data-testid="button-registration-closed"
                  >
                    {isSoldOut ? "Sold Out" : registrationClosed ? "Registration Closed" : "Registration Unavailable"}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Form Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name: {user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 1234567890" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science" {...field} data-testid="input-branch" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year *</FormLabel>
                    <FormControl>
                      <Input placeholder="2nd Year" {...field} data-testid="input-year" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I accept the terms and conditions
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {event.isPaid && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-1">Payment Summary</p>
                  <p className="text-2xl font-bold text-primary">₹{event.price}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Payment will be processed after clicking Register
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full hover-elevate active-elevate-2"
                disabled={registerMutation.isPending}
                data-testid="button-submit-registration"
              >
                {registerMutation.isPending ? "Processing..." : event.isPaid ? "Proceed to Payment" : "Complete Registration"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md text-center">
          <div className="mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Registration Successful!</DialogTitle>
            <p className="text-muted-foreground">
              You're all set for {event.title}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full hover-elevate active-elevate-2"
              onClick={() => navigate("/tickets")}
              data-testid="button-view-my-ticket"
            >
              View My Ticket
            </Button>
            <Button
              variant="outline"
              className="w-full hover-elevate"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
