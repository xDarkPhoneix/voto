import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election, Candidate } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const candidateSchema = z.object({
  name: z.string().min(2).max(100),
  party: z.string().min(2).max(100),
  imageUrl: z.string().url().optional().or(z.literal("")),
  walletAddress: z.string().min(10, "Wallet address required"),
});

type CandidateForm = z.infer<typeof candidateSchema>;

export default function AdminCandidates() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
  });

  useEffect(() => {
    contractService.getElections().then((els) => {
      setElections(els);
      if (els.length > 0) setSelectedElection(els[0].id);
    });
  }, []);

  const currentElection = elections.find((e) => e.id === selectedElection);

  const onAdd = async (data: CandidateForm) => {
    if (!selectedElection) return;
    try {
      await contractService.addCandidate(selectedElection, {
        name: data.name,
        party: data.party,
        imageUrl: data.imageUrl || "",
        walletAddress: data.walletAddress,
      });
      const updated = await contractService.getElections();
      setElections(updated);
      toast({ title: "Candidate added!" });
      setOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">Manage election candidates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="glow-primary"><PlusCircle className="mr-2 h-4 w-4" />Add Candidate</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...register("name")} className="mt-1 bg-secondary/50" />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Party</Label>
                <Input {...register("party")} className="mt-1 bg-secondary/50" />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input {...register("imageUrl")} className="mt-1 bg-secondary/50" />
              </div>
              <div>
                <Label>Wallet Address</Label>
                <Input {...register("walletAddress")} className="mt-1 bg-secondary/50" />
              </div>
              <Button type="submit" className="w-full">Add Candidate</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Election selector */}
      <div className="mb-6">
        <Select value={selectedElection} onValueChange={setSelectedElection}>
          <SelectTrigger className="w-64 bg-secondary/50">
            <SelectValue placeholder="Select election" />
          </SelectTrigger>
          <SelectContent>
            {elections.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Candidates table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead className="text-right">Votes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentElection?.candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.party}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.walletAddress}</TableCell>
                <TableCell className="text-right font-semibold">{c.votes}</TableCell>
              </TableRow>
            ))}
            {(!currentElection || currentElection.candidates.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  No candidates yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
