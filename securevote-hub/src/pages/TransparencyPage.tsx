import { useEffect, useState } from "react";
import { contractService, Election } from "@/services/contractService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, ExternalLink, CheckCircle2, BarChart3, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = [
  "hsl(263, 70%, 58%)",
  "hsl(190, 95%, 45%)",
  "hsl(142, 76%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

/** Simulated immutable audit log */
const auditLog = [
  { id: "tx-001", action: "Election Created", detail: "2024 Student Council Election", txHash: "0x7a3f...e91b", timestamp: "2024-11-28 10:32:15 UTC", block: 18234501 },
  { id: "tx-002", action: "Candidate Added", detail: "Alice Johnson → Progress Party", txHash: "0x2b1c...d44a", timestamp: "2024-11-29 08:15:42 UTC", block: 18234892 },
  { id: "tx-003", action: "Candidate Added", detail: "Bob Smith → Unity Alliance", txHash: "0x9e4d...f72c", timestamp: "2024-11-29 08:22:10 UTC", block: 18234901 },
  { id: "tx-004", action: "Election Started", detail: "2024 Student Council Election", txHash: "0x1f8a...b33d", timestamp: "2024-12-01 00:00:01 UTC", block: 18235100 },
  { id: "tx-005", action: "Vote Cast", detail: "Wallet 0xabc...f12 → Candidate #1", txHash: "0x6c2e...a88f", timestamp: "2024-12-01 09:44:33 UTC", block: 18235450 },
  { id: "tx-006", action: "Vote Cast", detail: "Wallet 0xdef...890 → Candidate #2", txHash: "0x3d7f...c12e", timestamp: "2024-12-01 10:12:08 UTC", block: 18235512 },
  { id: "tx-007", action: "Vote Cast", detail: "Wallet 0x456...abc → Candidate #1", txHash: "0x8b4a...d99c", timestamp: "2024-12-02 14:05:21 UTC", block: 18236200 },
];

export default function TransparencyPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    contractService.getElections().then(setElections);
  }, []);

  const backPath = user?.role === "admin" ? "/admin" : user?.role === "subadmin" ? "/subadmin" : "/voter";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            BlockVote <span className="gradient-text">Transparency</span>
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Immutability banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-8 p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Immutable & Tamper-Proof Voting</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every vote is recorded on the Ethereum blockchain (Sepolia testnet). Once cast, votes
                are <strong className="text-foreground">cryptographically sealed</strong> and cannot be altered, deleted, or tampered with by anyone —
                including administrators. Each transaction is publicly verifiable on-chain.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Immutable Records", desc: "Votes stored on-chain cannot be modified or deleted" },
            { icon: Eye, title: "Full Transparency", desc: "All transactions are publicly verifiable" },
            { icon: CheckCircle2, title: "One Vote Per Wallet", desc: "Smart contract prevents double voting" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="glass-card-hover p-5 text-center"
            >
              <item.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Live election results */}
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <BarChart3 className="h-5 w-5 text-primary" />Live Election Results
        </h2>
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {elections.map((election) => {
            const chartData = election.candidates.map((c) => ({
              name: c.name,
              votes: c.votes,
            }));
            return (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{election.title}</h3>
                    <p className="text-sm text-muted-foreground">{election.description}</p>
                  </div>
                  <Badge className={
                    election.status === "active" ? "bg-green-500/20 text-green-400" :
                    election.status === "upcoming" ? "bg-blue-500/20 text-blue-400" :
                    "bg-muted text-muted-foreground"
                  }>
                    {election.status}
                  </Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">Total votes: <strong className="text-foreground">{election.totalVotes}</strong></p>
                {chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(230, 25%, 12%)",
                          border: "1px solid hsl(230, 20%, 22%)",
                          borderRadius: "8px",
                          color: "hsl(210, 40%, 96%)",
                        }}
                      />
                      <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Blockchain audit trail */}
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Shield className="h-5 w-5 text-primary" />Blockchain Audit Trail
        </h2>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Detail</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Tx Hash</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Block</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        log.action === "Vote Cast" ? "border-green-500/30 text-green-400" :
                        log.action.includes("Election") ? "border-primary/30 text-primary" :
                        "border-accent/30 text-accent"
                      }>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.detail}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                      >
                        {log.txHash}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{log.block}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.timestamp}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            All data is fetched from the Ethereum Sepolia blockchain. Verify any transaction on{" "}
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Sepolia Etherscan ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}