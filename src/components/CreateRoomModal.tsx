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
import { useAuth } from "@/lib/auth";

export interface RoomPrefill {
  hackathon?: string;
  name?: string;
  description?: string;
  maxSize?: number;
  deadlineRegistration?: string;
  deadlinePpt?: string;
  deadlinePrototype?: string;
  deadlineFinal?: string;
  deadlineResult?: string;
}

export function CreateRoomModal({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill?: RoomPrefill;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hackathon = fd.get("hackathon") as string;
    const name = fd.get("name") as string;

    const githubUrl = (fd.get("githubUrl") as string)?.trim();
    const figmaUrl = (fd.get("figmaUrl") as string)?.trim();
    const demoUrl = (fd.get("demoUrl") as string)?.trim();
    const docsUrl = (fd.get("docsUrl") as string)?.trim();

    const projectLinks = [
      { label: "GitHub Repo", url: githubUrl },
      { label: "Figma", url: figmaUrl },
      { label: "Demo", url: demoUrl },
      { label: "Documentation", url: docsUrl },
    ].filter((l) => Boolean(l.url));

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
          projectLinks,
          creatorId: user?._id,
          creatorEmail: user?.email,
          creatorName: user?.name,
          creatorAvatar: user?.avatar,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a room</DialogTitle>
          <DialogDescription>
            Spin up a private hackathon workspace for your team.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} className="grid gap-4 py-2" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hackathon name">
              <Input name="hackathon" placeholder="Smart India Hackathon 2026" required defaultValue={prefill?.hackathon ?? ""} />
            </Field>
            <Field label="Room name">
              <Input name="name" placeholder="Team Nebula" required defaultValue={prefill?.name ?? ""} />
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
              <Input name="maxSize" type="number" min={1} max={20} defaultValue={prefill?.maxSize ?? 6} />
            </Field>
            <Field label="Registration deadline">
              <Input name="deadlineRegistration" type="date" defaultValue={prefill?.deadlineRegistration ?? ""} />
            </Field>
            <Field label="PPT submission">
              <Input name="deadlinePpt" type="date" defaultValue={prefill?.deadlinePpt ?? ""} />
            </Field>
            <Field label="Prototype submission">
              <Input name="deadlinePrototype" type="date" defaultValue={prefill?.deadlinePrototype ?? ""} />
            </Field>
            <Field label="Final submission">
              <Input name="deadlineFinal" type="date" defaultValue={prefill?.deadlineFinal ?? ""} />
            </Field>
            <Field label="Result date">
              <Input name="deadlineResult" type="date" defaultValue={prefill?.deadlineResult ?? ""} />
            </Field>
          </div>

          {/* Project Links Section */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <h4 className="text-sm font-semibold">Project links</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="GitHub Repo URL">
                <Input name="githubUrl" placeholder="https://github.com/org/repo" />
              </Field>
              <Field label="Figma Design URL">
                <Input name="figmaUrl" placeholder="https://figma.com/file/..." />
              </Field>
              <Field label="Live Demo URL">
                <Input name="demoUrl" placeholder="https://my-demo-app.com" />
              </Field>
              <Field label="Docs / Notion URL">
                <Input name="docsUrl" placeholder="https://notion.so/..." />
              </Field>
            </div>
          </div>

          <Field label="Description">
            <Textarea
              name="description"
              rows={3}
              placeholder="Anything else your team should know."
              defaultValue={prefill?.description ?? ""}
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
