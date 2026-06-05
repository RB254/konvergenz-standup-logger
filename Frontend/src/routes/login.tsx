import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Team Standup Logger" },
      { name: "description", content: "Sign in to submit and view team standups." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { ready, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/" });
  }, [ready, isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Username and password are required");
      return;
    }
    setBusy(true);
    try {
      const fn = mode === "signin" ? authApi.login : authApi.register;
      const data = await fn(username.trim(), password);
      signIn(data.username, data.token);
      toast.success(mode === "signin" ? "Welcome back" : "Account created");
      navigate({ to: "/" });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        (mode === "signin" ? "Invalid credentials" : "Could not create account");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Radio className="h-6 w-6" />
          </div>
          <CardTitle className="text-center">Team Standup Logger</CardTitle>
          <CardDescription className="text-center">
            {mode === "signin" ? "Sign in to continue" : "Create your team account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "signin"
                ? "No account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
