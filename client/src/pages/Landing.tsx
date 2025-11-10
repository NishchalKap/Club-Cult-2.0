import { Button } from "@/components/ui/button";
import { Calendar, Users, Sparkles, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <header className="relative z-10 border-b border-border/50 backdrop-blur-lg bg-background/80">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Club Cult</span>
            </div>
            <Button 
              asChild 
              data-testid="button-login"
              className="hover-elevate active-elevate-2"
            >
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Campus,{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Your Culture
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Discover exciting campus events, register instantly, and never miss out on the experiences that make your university life memorable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild
                className="h-12 px-8 text-base font-semibold hover-elevate active-elevate-2"
                data-testid="button-get-started"
              >
                <a href="/api/login">Get Started</a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-12 px-8 text-base font-semibold hover-elevate active-elevate-2"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From event discovery to seamless registration, Club Cult makes campus life easier for everyone
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-border bg-card hover-elevate">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
            <p className="text-sm text-muted-foreground">
              Browse all campus events in one place with powerful filters and search
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card hover-elevate">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Registration</h3>
            <p className="text-sm text-muted-foreground">
              Register for events in seconds with pre-filled forms and secure payments
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card hover-elevate">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Club Management</h3>
            <p className="text-sm text-muted-foreground">
              Create events, manage registrations, and track analytics effortlessly
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card hover-elevate">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Get insights into event performance and student engagement
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Campus Experience?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of students discovering the best events on campus
          </p>
          <Button 
            size="lg" 
            asChild
            className="h-12 px-8 text-base font-semibold hover-elevate active-elevate-2"
            data-testid="button-join-now"
          >
            <a href="/api/login">Join Now - It's Free</a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Club Cult</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Club Cult. Your Campus, Your Culture.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
