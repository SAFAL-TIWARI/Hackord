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

export function CreateRoomModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a room</DialogTitle>
          <DialogDescription>Spin up a private hackathon workspace for your team.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenChange(false);
            toast.success("Room created — Team Nebula");
            navigate({ to: "/rooms/$roomId", params: { roomId: "smart-india-2026" } });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hackathon name"><Input placeholder="Smart India Hackathon 2026" required /></Field>
            <Field label="Room name"><Input placeholder="Team Nebula" required /></Field>
          </div>
          <Field label="Problem statement">
            <Textarea rows={3} placeholder="Briefly describe the problem you're solving." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Maximum team size"><Input type="number" min={1} max={20} defaultValue={6} /></Field>
            <Field label="Registration deadline"><Input type="date" /></Field>
            <Field label="PPT submission"><Input type="date" /></Field>
            <Field label="Prototype submission"><Input type="date" /></Field>
            <Field label="Final submission"><Input type="date" /></Field>
            <Field label="Result date"><Input type="date" /></Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} placeholder="Anything else your team should know." />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
