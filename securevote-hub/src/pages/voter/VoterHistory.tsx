import { DashboardLayout } from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

// Mock voting history
const mockHistory = [
  { id: "1", election: "2024 Student Council Election", candidate: "Alice Johnson", date: "2024-12-15", txHash: "0xabc...def123", status: "confirmed" },
  { id: "2", election: "Community Budget Allocation", candidate: "Plan A: Infrastructure", date: "2024-11-20", txHash: "0x123...abc456", status: "confirmed" },
];

export default function VoterHistory() {
  return (
    <DashboardLayout role="voter">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Voting History</h1>
        <p className="text-muted-foreground">Your past votes recorded on the blockchain</p>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Election</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHistory.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.election}</TableCell>
                <TableCell>{h.candidate}</TableCell>
                <TableCell className="text-muted-foreground">{h.date}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{h.txHash}</TableCell>
                <TableCell>
                  <Badge className="bg-green-500/20 text-green-400">Confirmed</Badge>
                </TableCell>
              </TableRow>
            ))}
            {mockHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  No voting history yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
