import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Play, Square, Vote } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const electionSchema = z.object({
  title: z.string().min(3, "Title is required").max(100),
  description: z.string().min(10, "Description is required").max(500),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type ElectionForm = z.infer<typeof electionSchema>;

export default function AdminElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ElectionForm>({
    resolver: zodResolver(electionSchema),
  });

  useEffect(() => {
    contractService.getElections().then(setElections);
  }, []);

  const onCreate = async (data: ElectionForm) => {
    try {
      const el = await contractService.createElection({ title: data.title!, description: data.description!, startDate: data.startDate!, endDate: data.endDate! });
      setElections((prev) => [...prev, el]);
      toast({ title: "Election created!" });
      setOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  const toggleElection = async (id: string, action: "start" | "end") => {
    setLoading(id);
    try {
      if (action === "start") await contractService.startElection(id);
      else await contractService.endElection(id);
      const updated = await contractService.getElections();
      setElections(updated);
      toast({ title: `Election ${action === "start" ? "started" : "ended"}!` });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
    setLoading(null);
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Elections</h1>
          <p className="text-muted-foreground">Create and manage elections</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="glow-primary"><PlusCircle className="mr-2 h-4 w-4" />Create Election</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>Create Election</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input {...register("title")} className="mt-1 bg-secondary/50" />
                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea {...register("description")} className="mt-1 bg-secondary/50" />
                {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input {...register("startDate")} type="datetime-local" className="mt-1 bg-secondary/50" />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input {...register("endDate")} type="datetime-local" className="mt-1 bg-secondary/50" />
                </div>
              </div>
              <Button type="submit" className="w-full">Create Election</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {elections.map((el) => (
          <div key={el.id} className="glass-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/20 p-2.5">
                  <Vote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{el.title}</h3>
                  <p className="text-sm text-muted-foreground">{el.description}</p>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span>{el.candidates.length} candidates</span>
                    <span>{el.totalVotes} votes</span>
                    <span className={`font-medium ${
                      el.status === "active" ? "text-green-400" : el.status === "upcoming" ? "text-blue-400" : "text-gray-400"
                    }`}>{el.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {el.status === "upcoming" && (
                  <Button size="sm" onClick={() => toggleElection(el.id, "start")} disabled={loading === el.id}>
                    <Play className="mr-1 h-3 w-3" />Start
                  </Button>
                )}
                {el.status === "active" && (
                  <Button size="sm" variant="destructive" onClick={() => toggleElection(el.id, "end")} disabled={loading === el.id}>
                    <Square className="mr-1 h-3 w-3" />End
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
