import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election } from "@/services/contractService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

import { Trophy } from "lucide-react";

const COLORS = [
  "hsl(263, 70%, 58%)",
  "hsl(190, 95%, 45%)",
  "hsl(142, 76%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)"
];

export default function VoterResults() {

  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [loading, setLoading] = useState(true);

  /* -----------------------------------------
     Load Elections
  ----------------------------------------- */

  useEffect(() => {

    const loadElections = async () => {

      try {

        const els = await contractService.getElections();

        setElections(els);

        const available = els.filter(
          (e) => e.status === "active" || e.status === "ended"
        );

        if (available.length > 0) {
          setSelectedElection(available[0].id);
        }

      } catch (error) {

        console.error("Failed to load elections", error);

      } finally {

        setLoading(false);

      }
    };

    loadElections();

  }, []);

  /* -----------------------------------------
     Selected Election
  ----------------------------------------- */

  const currentElection = elections.find(
    (e) => e.id === selectedElection
  );

  /* -----------------------------------------
     Chart Data
  ----------------------------------------- */

  const chartData =
    currentElection?.candidates.map((c) => ({
      name: c.name,
      votes: c.votes
    })) || [];

  /* -----------------------------------------
     Winner Logic
  ----------------------------------------- */

  const winner =
    currentElection?.candidates.reduce(
      (max, candidate) =>
        candidate.votes > max.votes ? candidate : max,
      currentElection?.candidates[0] || { name: "", votes: 0 }
    );

  /* -----------------------------------------
     UI
  ----------------------------------------- */

  return (
    <DashboardLayout role="voter">

      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          Election Results
        </h1>

        <p className="text-muted-foreground">
          View vote results recorded on the blockchain
        </p>

      </div>

      {/* Election Selector */}

      <div className="mb-6">

        <Select
          value={selectedElection}
          onValueChange={setSelectedElection}
        >

          <SelectTrigger className="w-64 bg-secondary/50">

            <SelectValue placeholder="Select election" />

          </SelectTrigger>

          <SelectContent>

            {elections
              .filter((e) => e.status !== "upcoming")
              .map((e) => (

                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>

              ))}

          </SelectContent>

        </Select>

      </div>

      {/* Winner Card */}

      {winner &&
        winner.votes > 0 &&
        currentElection?.status === "ended" && (

          <div className="mb-6 glass-card p-6">

            <div className="flex items-center gap-3">

              <div className="rounded-full bg-yellow-500/20 p-3">

                <Trophy className="h-6 w-6 text-yellow-400" />

              </div>

              <div>

                <p className="text-sm text-muted-foreground">
                  Winner
                </p>

                <p className="text-xl font-bold">
                  {winner.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {winner.votes} votes
                </p>

              </div>

            </div>

          </div>

        )}

      {/* Vote Chart */}

      <div className="glass-card p-6">

        <h3 className="mb-4 font-semibold">
          Vote Distribution
        </h3>

        {loading ? (

          <p className="py-12 text-center text-muted-foreground">
            Loading results...
          </p>

        ) : chartData.length > 0 ? (

          <ResponsiveContainer width="100%" height={350}>

            <BarChart data={chartData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(230, 20%, 18%)"
              />

              <XAxis
                dataKey="name"
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
              />

              <YAxis
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(230, 25%, 12%)",
                  border: "1px solid hsl(230, 20%, 22%)",
                  borderRadius: "8px"
                }}
              />

              <Bar
                dataKey="votes"
                radius={[6, 6, 0, 0]}
              >

                {chartData.map((_, index) => (

                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        ) : (

          <p className="py-12 text-center text-muted-foreground">
            No results available
          </p>

        )}

      </div>

    </DashboardLayout>
  );
}