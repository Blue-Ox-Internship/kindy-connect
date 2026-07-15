import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Sun, Bell, ShieldCheck, BookOpenCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Little Stars - Kindergarten Attendance & Parent Notification" },
      {
        name: "description",
        content:
          "Track pupil arrival and departure and automatically notify parents via SMS and email.",
      },
      { property: "og:title", content: "Little Stars Kindergarten System" },
      {
        property: "og:description",
        content: "Attendance + automatic parent notifications for kindergartens.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { currentUser, login } = useStore();
  const navigate = useNavigate();
  const [assignedId, setAssignedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) navigate({ to: "/app/dashboard" });
  }, [currentUser, navigate]);

  const doLogin = async () => {
    if (!assignedId.trim()) return toast.error("Enter your assigned ID");
    setIsLoading(true);
    try {
      const u = await login(assignedId.trim());
      if (!u) {
        toast.error("Invalid ID or account not verified");
        setIsLoading(false);
        return;
      }
      toast.success(`Welcome, ${u.name.split(" ")[0]}`);
      navigate({ to: "/app/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      doLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">Little Stars</span>
        </div>
      </header>

      <section className="grid lg:grid-cols-2 gap-10 items-center px-6 lg:px-12 py-10 lg:py-16 max-w-7xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/30 px-3 py-1 text-xs font-semibold text-secondary-foreground mb-5">
            <Sun className="h-3.5 w-3.5" /> A sunny day at school
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Every arrival.
            <br />
            Every departure.
            <br />
            <span className="text-accent">Parents in the loop.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            A friendly kindergarten attendance system that automatically texts and emails parents
            the moment their little one arrives or leaves.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-lg">
            <Feature icon={Bell} title="Instant SMS + email" />
            <Feature icon={ShieldCheck} title="Role-based access" />
            <Feature icon={BookOpenCheck} title="Full audit trail" />
          </div>
        </div>

        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-7">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Enter the ID assigned by your admin.
            </p>
            <div className="space-y-3 mt-4">
              <div>
                <Label>Assigned ID</Label>
                <Input
                  value={assignedId}
                  onChange={(e) => setAssignedId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="kst-001"
                  disabled={isLoading}
                />
              </div>
              <Button className="w-full" onClick={doLogin} disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ask your administrator for your login ID.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="rounded-2xl bg-card border p-3 flex flex-col items-start gap-2 shadow-sm">
      <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
