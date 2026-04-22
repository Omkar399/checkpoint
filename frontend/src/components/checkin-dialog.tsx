"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CheckInDialogProps {
  trigger: ReactNode;
  targetUnit?: string | null;
  targetLabel?: string | null;
  onSubmit: (value: number | null, note: string | null) => Promise<void> | void;
}

export function CheckInDialog({ trigger, targetUnit, targetLabel, onSubmit }: CheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setValue("");
    setNote("");
    setError(null);
    setSubmitting(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedValue = value.trim();
    const parsedValue = trimmedValue === "" ? null : Number(trimmedValue);
    if (parsedValue !== null && Number.isNaN(parsedValue)) {
      setError("Value must be a number.");
      return;
    }
    const trimmedNote = note.trim();
    if (parsedValue === null && trimmedNote === "") {
      setError("Add a value or a note.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsedValue, trimmedNote === "" ? null : trimmedNote);
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record check-in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a check-in</DialogTitle>
          <DialogDescription>
            Share your progress for today. {targetLabel ? `Goal: ${targetLabel}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="checkin-value">
              Value{targetUnit ? <span className="text-muted-foreground">({targetUnit})</span> : null}
            </Label>
            <Input
              id="checkin-value"
              type="number"
              inputMode="decimal"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={targetUnit ? `e.g. 30 ${targetUnit}` : "Optional number"}
              disabled={submitting}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="checkin-note">Note</Label>
            <textarea
              id="checkin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you do today?"
              rows={3}
              disabled={submitting}
              className={cn(
                "min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors",
                "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
              )}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={submitting} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Recording…" : "Check in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
