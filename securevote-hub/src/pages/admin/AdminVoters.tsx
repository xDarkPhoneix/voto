import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface MockVoter {
  id: string;
  fullName: string;
  email: string;
  walletAddress: string;
  aadhaarId: string;
  isApproved: boolean | null;
}

const initialVoters: MockVoter[] = [
  { id: "v1", fullName: "Rahul Kumar", email: "rahul@example.com", walletAddress: "0xabc...123", aadhaarId: "1234-5678-9012", isApproved: true },
  { id: "v2", fullName: "Priya Singh", email: "priya@example.com", walletAddress: "0xdef...456", aadhaarId: "9876-5432-1098", isApproved: null },
  { id: "v3", fullName: "Amit Patel", email: "amit@example.com", walletAddress: "0xghi...789", aadhaarId: "5555-6666-7777", isApproved: null },
  { id: "v4", fullName: "Sneha Gupta", email: "sneha@example.com", walletAddress: "0xjkl...012", aadhaarId: "1111-2222-3333", isApproved: false },
];

export default function AdminVoters() {
  const [voters, setVoters] = useState<MockVoter[]>(initialVoters);

  const updateStatus = (id: string, approved: boolean) => {
    setVoters((prev) => prev.map((v) => (v.id === id ? { ...v, isApproved: approved } : v)));
    toast({ title: `Voter ${approved ? "approved" : "rejected"}` });
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Registered Voters</h1>
        <p className="text-muted-foreground">Approve or reject voter registrations</p>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Aadhaar ID</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voters.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{v.email}</TableCell>
                <TableCell className="font-mono text-xs">{v.aadhaarId}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{v.walletAddress}</TableCell>
                <TableCell>
                  {v.isApproved === true && <Badge className="bg-green-500/20 text-green-400">Approved</Badge>}
                  {v.isApproved === false && <Badge variant="destructive">Rejected</Badge>}
                  {v.isApproved === null && <Badge variant="secondary">Pending</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  {v.isApproved === null && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, true)} className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/10">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, false)} className="h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
