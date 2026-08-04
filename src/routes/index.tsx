import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Bell,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "Kindy Connect — Kindergarten Management Platform" },
        {
          name: "description",
          content:
            "Streamline attendance tracking, parent communication, and school management for kindergartens. Real-time SMS & email notifications.",
        },
        { property: "og:title", content: "Kindy Connect" },
        {
          property: "og:description",
          content: "Kindergarten management and parent communication platform.",
        },
      ],
    }),
    component: Landing,
  },
);

/* ─────────────────────────── Landing Page ─────────────────────────── */

function Landing() {
  const { currentUser, login } = useStore();
  const navigate = useNavigate();
  const [assignedId, setAssignedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      doLogin();
    }
  };

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Kindy Connect
            </span>
          </div>
          <Button size="sm" onClick={scrollToLogin}>
            Sign in
          </Button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pt-28 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Trusted by kindergartens across East Africa
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your kindergarten,{" "}
              <span className="text-primary">connected.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Track every arrival and departure. Notify parents instantly via SMS and email.
              Manage classes, marks, and reports — all in one place.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" onClick={scrollToLogin} className="gap-2 px-8">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToLogin}>
                Sign in to your account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to run a kindergarten
            </h2>
            <p className="mt-4 text-muted-foreground">
              From attendance to report cards — streamline your daily operations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Clock}
              title="Attendance tracking"
              description="Record arrivals and departures with timestamps, transport details, and operator info."
            />
            <FeatureCard
              icon={Bell}
              title="Parent notifications"
              description="Automatic SMS and email alerts when pupils arrive or leave school."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Role-based access"
              description="Separate dashboards for super admins, school staff, and teachers."
            />
            <FeatureCard
              icon={BarChart3}
              title="Reports & marks"
              description="Generate printable report cards with academic performance and attendance data."
            />
          </div>
        </div>
      </section>

      {/* ── Trust / Stats ───────────────────────────────────────────── */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock value="100%" label="Uptime" />
            <StatBlock value="Real-time" label="Parent alerts" />
            <StatBlock value="Secure" label="Role-based access" />
            <StatBlock value="Free" label="To get started" />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three simple steps to modernize your kindergarten management.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <StepCard
              number="01"
              title="Set up your school"
              description="Admin creates the school, adds classes, and registers teachers with unique login IDs."
            />
            <StepCard
              number="02"
              title="Enroll pupils & parents"
              description="Add pupils to classes and link parent contact details for SMS and email notifications."
            />
            <StepCard
              number="03"
              title="Track & notify"
              description="Teachers log arrivals and departures. Parents receive instant notifications."
            />
          </div>
        </div>
      </section>

      {/* ── Login Section ───────────────────────────────────────────── */}
      <section ref={loginRef} className="border-t" id="login">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-md">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Sign in to Kindy Connect
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the ID assigned by your administrator.
              </p>
            </div>

            <Card className="border shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-id">Assigned ID</Label>
                    <Input
                      id="login-id"
                      value={assignedId}
                      onChange={(e) => setAssignedId(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. KC001"
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={doLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in…" : "Sign in"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Don't have an ID? Contact your school administrator.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Kindy Connect</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Kindy Connect. Built for kindergartens.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────── Sub-components ───────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold tracking-tight text-primary">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border bg-card p-6">
      <span className="mb-3 inline-block text-3xl font-bold text-primary/20">
        {number}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
