import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

import { Check, X } from "lucide-react"


interface Voter {
  _id: string
  fullName: string
  email: string
  walletAddress: string
  aadhaarId: string
  isApproved: boolean | null
}


export default function AdminVoters() {

  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState<string | null>(null)


  /* =========================================
     Load voters from backend
  ========================================= */

  const loadVoters = async () => {

    try {

      const res = await fetch("/api/users/voters")

      const data = await res.json()

      setVoters(data)

    } catch (error) {

      toast({
        title: "Failed to load voters",
        variant: "destructive"
      })

    }

  }

  useEffect(() => {
    loadVoters()
  }, [])


  /* =========================================
     Approve / Reject voter
  ========================================= */

  const updateStatus = async (
    id: string,
    approved: boolean
  ) => {

    setLoading(id)

    try {

      await fetch(`/api/users/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ approved })
      })

      toast({
        title: `Voter ${approved ? "approved" : "rejected"}`
      })

      await loadVoters()

    } catch (error) {

      toast({
        title: "Update failed",
        variant: "destructive"
      })

    }

    setLoading(null)

  }


  /* =========================================
     UI
  ========================================= */

  return (

    <DashboardLayout role="admin">

      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          Registered Voters
        </h1>

        <p className="text-muted-foreground">
          Approve or reject voter registrations
        </p>

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

            {voters.map(v => (

              <TableRow key={v._id}>

                <TableCell className="font-medium">
                  {v.fullName}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {v.email}
                </TableCell>

                <TableCell className="font-mono text-xs">
                  {v.aadhaarId}
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {v.walletAddress}
                </TableCell>


                {/* Status */}

                <TableCell>

                  {v.isApproved === true && (
                    <Badge className="bg-green-500/20 text-green-400">
                      Approved
                    </Badge>
                  )}

                  {v.isApproved === false && (
                    <Badge variant="destructive">
                      Rejected
                    </Badge>
                  )}

                  {v.isApproved === null && (
                    <Badge variant="secondary">
                      Pending
                    </Badge>
                  )}

                </TableCell>


                {/* Actions */}

                <TableCell className="text-right">

                  {v.isApproved === null && (

                    <div className="flex justify-end gap-2">

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading === v._id}
                        onClick={() => updateStatus(v._id, true)}
                        className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        <Check className="h-3 w-3" />
                      </Button>


                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading === v._id}
                        onClick={() => updateStatus(v._id, false)}
                        className="h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
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

  )

}