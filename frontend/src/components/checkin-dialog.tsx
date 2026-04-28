"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2Icon, ListChecksIcon } from "lucide-react";
import { toast } from "sonner";
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
import { normalizeChannelItem } from "@/lib/api/types";
import type { ChannelItem, ChannelKind, FieldState } from "@/lib/api/types";

interface CheckInDialogProps {
  trigger: ReactNode;
  kind?: ChannelKind;
  targetUnit?: string | null;
  targetLabel?: string | null;
  items?: ChannelItem[] | null;
  onSubmit: (
    value: number | null,
    note: string | null,
    payload?: {
      checkedItems?: number[] | null;
      fieldStates?: FieldState[] | null;
    },
  ) => Promise<void> | void;
}

export function CheckInDialog({
  trigger,
  kind = "numeric",
  targetUnit,
  targetLabel,
  items,
  onSubmit,
}: CheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [numericValues, setNumericValues] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedItems = (items ?? []).map(normalizeChannelItem);
  const hasMixedTypes = normalizedItems.some((it) => it.type === "numeric");

  // Reset state when dialog opens for a checklist channel
  useEffect(() => {
    if (open && kind === "checklist") {
      setCheckedItems(new Set());
      setNumericValues({});
    }
  }, [open, kind]);

  function toggleItem(idx: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function setNumericValue(idx: number, raw: string) {
    setNumericValues((prev) => ({ ...prev, [idx]: raw }));
  }

  function reset() {
    setValue("");
    setNote("");
    setCheckedItems(new Set());
    setNumericValues({});
    setError(null);
    setSubmitting(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedNote = note.trim();

    let valueToSend: number | null;
    let checkedItemsToSend: number[] | null = null;
    let fieldStatesToSend: FieldState[] | null = null;

    if (kind === "binary") {
      valueToSend = 1;
    } else if (kind === "freeform") {
      if (trimmedNote === "") {
        setError("Add a note.");
        return;
      }
      valueToSend = null;
    } else if (kind === "checklist") {
      // Build field_states for any binary tick or non-empty numeric value
      const states: FieldState[] = [];
      for (let idx = 0; idx < normalizedItems.length; idx++) {
        const item = normalizedItems[idx];
        if (item.type === "binary") {
          if (checkedItems.has(idx)) {
            states.push({ idx, checked: true });
          }
        } else {
          const raw = (numericValues[idx] ?? "").trim();
          if (raw === "") continue;
          const parsed = Number(raw);
          if (Number.isNaN(parsed)) {
            setError(`"${item.label}" needs a valid number.`);
            return;
          }
          states.push({ idx, value: parsed });
        }
      }

      if (states.length === 0) {
        setError("Tick or fill at least one item.");
        return;
      }

      // For backwards compat, also send the binary indices as checked_items
      const binaryIdxs = states
        .filter((s) => s.checked === true)
        .map((s) => s.idx)
        .sort((a, b) => a - b);
      checkedItemsToSend = binaryIdxs.length > 0 ? binaryIdxs : null;
      fieldStatesToSend = states;
      valueToSend = states.length; // count of items interacted with
    } else {
      // numeric
      const trimmedValue = value.trim();
      const parsedValue = trimmedValue === "" ? null : Number(trimmedValue);
      if (parsedValue !== null && Number.isNaN(parsedValue)) {
        setError("Value must be a number.");
        return;
      }
      if (parsedValue === null && trimmedNote === "") {
        setError("Add a value or a note.");
        return;
      }
      valueToSend = parsedValue;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        valueToSend,
        trimmedNote === "" ? null : trimmedNote,
        { checkedItems: checkedItemsToSend, fieldStates: fieldStatesToSend },
      );
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record check-in.");
    } finally {
      setSubmitting(false);
    }
  }

  const noteRequired = kind === "freeform";
  const noteClasses = cn(
    "min-h-16 w-full rounded-lg bg-[color:var(--color-ink-200)] px-3 py-2 text-sm text-foreground outline-none transition-colors",
    "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-muted-foreground hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] focus-visible:shadow-[inset_0_0_0_2px_#1ed760]",
    "disabled:pointer-events-none disabled:opacity-50",
  );

  const headerCopy = (() => {
    if (kind === "binary") {
      return {
        title: "Mark today done",
        desc: targetLabel ? `Confirm you did "${targetLabel}" today.` : "Confirm you did it today. Add a note if you want.",
      };
    }
    if (kind === "freeform") {
      return {
        title: "Add a reflection",
        desc: targetLabel ? `Today's update for ${targetLabel}.` : "Write a quick update for today.",
      };
    }
    if (kind === "checklist") {
      return {
        title: "Check off what you did",
        desc: "Tick the items you completed today.",
      };
    }
    return {
      title: "Record a check-in",
      desc: `Share your progress for today.${targetLabel ? ` Goal: ${targetLabel}.` : ""}`,
    };
  })();

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
          <DialogTitle>{headerCopy.title}</DialogTitle>
          <DialogDescription>{headerCopy.desc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {kind === "checklist" && normalizedItems.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Items
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {(() => {
                    const binaryDone = normalizedItems.filter(
                      (it, i) => it.type === "binary" && checkedItems.has(i),
                    ).length;
                    const numericDone = normalizedItems.filter(
                      (it, i) =>
                        it.type === "numeric" && (numericValues[i] ?? "").trim() !== "",
                    ).length;
                    return `${binaryDone + numericDone} / ${normalizedItems.length}`;
                  })()}
                </span>
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg bg-[color:var(--color-ink-100)] p-1.5">
                {normalizedItems.map((item, idx) => {
                  if (item.type === "binary") {
                    const isChecked = checkedItems.has(idx);
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => toggleItem(idx)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isChecked
                              ? "bg-primary/10 text-foreground"
                              : "text-muted-foreground hover:bg-[color:var(--color-ink-200)] hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                              isChecked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-[color:var(--color-ink-600)] bg-transparent group-hover:border-foreground",
                            )}
                          >
                            {isChecked ? <CheckCircle2Icon className="size-3.5" /> : null}
                          </span>
                          <span className={cn("flex-1", isChecked ? "font-bold" : null)}>
                            {item.label}
                          </span>
                        </button>
                      </li>
                    );
                  }
                  // numeric item
                  const raw = numericValues[idx] ?? "";
                  const filled = raw.trim() !== "";
                  return (
                    <li key={idx} className="rounded-md px-2.5 py-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "shrink-0 text-[10px] font-bold uppercase tracking-wider",
                            filled ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          #
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            filled ? "font-bold text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {item.label}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          value={raw}
                          onChange={(e) => setNumericValue(idx, e.target.value)}
                          placeholder={item.unit ? `e.g. 30 ${item.unit}` : "value"}
                          className="h-8 w-32 text-sm"
                        />
                        {item.unit ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {item.unit}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : kind === "binary" ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="size-7 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Yes, I did it.</p>
                  <p className="text-xs text-muted-foreground">
                    Hit the green button below to confirm.
                  </p>
                </div>
              </div>
            </div>
          ) : kind === "numeric" ? (
            <div className="grid gap-2">
              <Label
                htmlFor="checkin-value"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Value
                {targetUnit ? (
                  <span className="ml-1 normal-case tracking-normal text-muted-foreground">
                    ({targetUnit})
                  </span>
                ) : null}
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
          ) : null}

          <div className="grid gap-2">
            <Label
              htmlFor="checkin-note"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              {noteRequired ? "Note" : (
                <>
                  Note <span className="font-normal normal-case tracking-normal text-muted-foreground/60">(optional)</span>
                </>
              )}
            </Label>
            <textarea
              id="checkin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                kind === "freeform"
                  ? "What's on your mind today?"
                  : kind === "binary"
                    ? "Optional context"
                    : "What did you do today?"
              }
              rows={kind === "freeform" ? 5 : 3}
              required={noteRequired}
              disabled={submitting}
              className={noteClasses}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" disabled={submitting} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting} className="btn-label" size={kind === "binary" ? "lg" : "default"}>
              {submitting
                ? "Recording…"
                : kind === "binary"
                  ? "Mark done"
                  : kind === "freeform"
                    ? "Save reflection"
                    : kind === "checklist"
                      ? hasMixedTypes
                        ? "Save"
                        : `Save (${checkedItems.size})`
                      : "Check in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
