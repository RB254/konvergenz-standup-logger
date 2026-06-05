import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { standupsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";

type Errors = Partial<Record<"author" | "yesterday" | "today", string>>;

export function StandupForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user } = useAuth();
  const [author, setAuthor] = useState(user?.name ?? "");
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [hasBlocker, setHasBlocker] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!author.trim()) e.author = "Author name is required";
    if (!yesterday.trim()) e.yesterday = "Tell us what you did yesterday";
    if (!today.trim()) e.today = "Tell us what you're doing today";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("author", author.trim());
      fd.append("yesterday", yesterday.trim());
      fd.append("today", today.trim());
      fd.append("blockers", blockers.trim());
      fd.append("has_blocker", hasBlocker ? "true" : "false");
      if (file) fd.append("file_attachment", file);
      await standupsApi.create(fd);
      toast.success("Standup submitted");
      setYesterday("");
      setToday("");
      setBlockers("");
      setHasBlocker(false);
      setFile(null);
      onSubmitted?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to submit standup. Check the API server.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "border border-[color:var(--primary)]/30 focus-visible:ring-[color:var(--primary)] focus-visible:border-[color:var(--primary)] rounded-md bg-white";

  return (
    <Card className="border border-border bg-white shadow-[var(--shadow-card)]">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-[color:var(--primary-deep)]">Submit today's standup</CardTitle>
        <CardDescription>
          Three quick prompts. Files are optional — screenshots help when you're blocked.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="author" className="text-[color:var(--primary-deep)] font-semibold">
              Author name <span className="text-[color:var(--brand-red)]">*</span>
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Jane Doe"
              aria-invalid={!!errors.author}
              className={fieldClass}
            />
            {errors.author && <p className="text-xs text-[color:var(--brand-red)]">{errors.author}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="yesterday" className="text-[color:var(--primary-deep)] font-semibold">
                Yesterday <span className="text-[color:var(--brand-red)]">*</span>
              </Label>
              <Textarea
                id="yesterday"
                rows={4}
                value={yesterday}
                onChange={(e) => setYesterday(e.target.value)}
                placeholder="What you shipped or worked on"
                className={fieldClass}
              />
              {errors.yesterday && (
                <p className="text-xs text-[color:var(--brand-red)]">{errors.yesterday}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="today" className="text-[color:var(--primary-deep)] font-semibold">
                Today <span className="text-[color:var(--brand-red)]">*</span>
              </Label>
              <Textarea
                id="today"
                rows={4}
                value={today}
                onChange={(e) => setToday(e.target.value)}
                placeholder="Your plan for today"
                className={fieldClass}
              />
              {errors.today && <p className="text-xs text-[color:var(--brand-red)]">{errors.today}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blockers" className="text-[color:var(--primary-deep)] font-semibold">
              Blockers
            </Label>
            <Textarea
              id="blockers"
              rows={3}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Anything in your way?"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[color:var(--primary-deep)]">
              <Checkbox
                checked={hasBlocker}
                onCheckedChange={(v) => setHasBlocker(v === true)}
              />
              I am blocked
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="file" className="text-sm text-muted-foreground">
                Attachment
              </Label>
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="max-w-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[color:var(--brand-red)] text-white hover:bg-[color:var(--brand-red)]/90 font-semibold uppercase tracking-wide px-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit standup
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
