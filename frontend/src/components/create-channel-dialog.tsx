"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { HashIcon, CheckCircle2Icon, NotebookPenIcon, ListChecksIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createChannel } from "@/lib/api/channels";
import type { Channel, ChannelKind } from "@/lib/api/types";

interface CreateChannelDialogProps {
  serverId: number;
  onCreated?: (channel: Channel) => void;
  trigger?: ReactNode;
}

const KIND_OPTIONS: Array<{
  kind: ChannelKind;
  label: string;
  helper: string;
  example: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    kind: "numeric",
    label: "Track a number",
    helper: "Log a value each check-in.",
    example: "minutes studied, km run, pages read",
    Icon: HashIcon,
  },
  {
    kind: "binary",
    label: "Just a checkmark",
    helper: "Did it happen today? Yes or no.",
    example: "took out trash, called mom, flossed",
    Icon: CheckCircle2Icon,
  },
  {
    kind: "freeform",
    label: "Reflection / note",
    helper: "Just a written update — no value.",
    example: "daily journal, standup, gratitude",
    Icon: NotebookPenIcon,
  },
  {
    kind: "checklist",
    label: "Checklist",
    helper: "A fixed list of items. Tick off what you finished today.",
    example: "chapters studied, morning routine, packing list",
    Icon: ListChecksIcon,
  },
];

export function CreateChannelDialog({ serverId, onCreated, trigger }: CreateChannelDialogProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ChannelKind>("numeric");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setKind("numeric");
    setName("");
    setDescription("");
    setTargetUnit("");
    setTargetLabel("");
    setItems([""]);
    setError(null);
    setSubmitting(false);
  }

  function updateItem(idx: number, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? value : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, ""]);
  }
  function removeItem(idx: number) {
    setItems((prev) => (prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      setError("Name must be 1-100 characters.");
      return;
    }
    let cleanedItems: string[] | null = null;
    if (kind === "checklist") {
      cleanedItems = items.map((it) => it.trim()).filter((it) => it.length > 0);
      if (cleanedItems.length === 0) {
        setError("Add at least one checklist item.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createChannel(serverId, {
        name: trimmed,
        description: description.trim() || null,
        target_unit: kind === "numeric" ? (targetUnit.trim() || null) : null,
        target_label: kind === "numeric" ? (targetLabel.trim() || null) : null,
        kind,
        items: cleanedItems,
      });
      onCreated?.(res.data);
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={trigger ? (trigger as React.ReactElement) : <Button>New channel</Button>} />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Create a channel</DialogTitle>
            <DialogDescription>
              Pick how members will check in. You can&apos;t change this later.
            </DialogDescription>
          </DialogHeader>

          {/* Kind picker */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Check-in style
            </Label>
            <div className="grid gap-2">
              {KIND_OPTIONS.map(({ kind: k, label, helper, example, Icon }) => {
                const isSelected = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                        : "border-[color:var(--color-ink-300)] bg-[color:var(--color-ink-100)] hover:border-[color:var(--color-ink-600)] hover:bg-[color:var(--color-ink-200)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-[color:var(--color-ink-200)] text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-bold text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground">{helper}</span>
                      <span className="text-[11px] text-muted-foreground/80 italic">e.g. {example}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="channel-name"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Name
              </Label>
              <Input
                id="channel-name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  kind === "binary" ? "garbage-day" : kind === "freeform" ? "daily-journal" : "daily-reading"
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="channel-description"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Description <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                id="channel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What do members commit to here?"
                rows={2}
              />
            </div>

            {kind === "numeric" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="channel-target-label"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    What you track <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    id="channel-target-label"
                    value={targetLabel}
                    onChange={(e) => setTargetLabel(e.target.value)}
                    placeholder="study time"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="channel-target-unit"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Unit <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    id="channel-target-unit"
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    placeholder="minutes"
                  />
                </div>
              </div>
            ) : null}

            {kind === "checklist" ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Checklist items
                </Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Members tick off whichever they did each day.
                </p>
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateItem(idx, e.target.value)}
                        placeholder={`Item ${idx + 1}`}
                        maxLength={120}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeItem(idx)}
                        aria-label={`Remove item ${idx + 1}`}
                        disabled={items.length === 1 && item.length === 0}
                      >
                        <XIcon />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="mt-1"
                >
                  <PlusIcon />
                  Add item
                </Button>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || name.trim().length === 0}
              className="btn-label"
            >
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
