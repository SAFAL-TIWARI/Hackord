import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createRoom } from "@/lib/rooms-api";

export function CreateRoomModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hackathon = fd.get("hackathon") as string;
    const name = fd.get("name") as string;

    // Generate a URL-safe ID from room name + timestamp
    const id =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) +
      "-" +
      Date.now().toString(36);

    try {
      await createRoom({
        data: {
          id,
          hackathon,
          name,
          problem: (fd.get("problem") as string) ?? "",
          description: (fd.get("description") as string) ?? "",
          maxSize: Number(fd.get("maxSize") ?? 6),
          deadlineRegistration: (fd.get("deadlineRegistration") as string) ?? "",
          deadlinePpt: (fd.get("deadlinePpt") as string) ?? "",
          deadlinePrototype: (fd.get("deadlinePrototype") as string) ?? "",
          deadlineFinal: (fd.get("deadlineFinal") as string) ?? "",
          deadlineResult: (fd.get("deadlineResult") as string) ?? "",
        },
      });

      onOpenChange(false);
      toast.success(`Room "${name}" created!`);
      navigate({ to: "/rooms/$roomId", params: { roomId: id } });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create room. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a room</DialogTitle>
          <DialogDescription>
            Spin up a private hackathon workspace for your team.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} className="grid gap-4 py-2" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hackathon name">
              <Input name="hackathon" placeholder="Smart India Hackathon 2026" required />
            </Field>
            <Field label="Room name">
              <Input name="name" placeholder="Team Nebula" required />
            </Field>
          </div>
          <Field label="Problem statement">
            <Textarea
              name="problem"
              rows={3}
              placeholder="Briefly describe the problem you're solving."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Maximum team size">
              <Input name="maxSize" type="number" min={1} max={20} defaultValue={6} />
            </Field>
            <Field label="Registration deadline">
              <Input name="deadlineRegistration" type="date" />
            </Field>
            <Field label="PPT submission">
              <Input name="deadlinePpt" type="date" />
            </Field>
            <Field label="Prototype submission">
              <Input name="deadlinePrototype" type="date" />
            </Field>
            <Field label="Final submission">
              <Input name="deadlineFinal" type="date" />
            </Field>
            <Field label="Result date">
              <Input name="deadlineResult" type="date" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              name="description"
              rows={3}
              placeholder="Anything else your team should know."
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
            >
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
