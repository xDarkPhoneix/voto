import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { contractService, Election } from "@/services/contractService"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

import { toast } from "@/hooks/use-toast"
import { PlusCircle, Play, Square, Vote } from "lucide-react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"


/* =========================================
   Form Validation
========================================= */

const electionSchema = z.object({
  title: z.string().min(3, "Title required"),
  description: z.string().min(3, "Description required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required")
})

type ElectionForm = z.infer<typeof electionSchema>


/* =========================================
   Component
========================================= */

export default function AdminElections() {

  const [elections, setElections] = useState<Election[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ElectionForm>({
    resolver: zodResolver(electionSchema)
  })


  /* =========================================
     Load Elections
  ========================================= */

  const loadElections = async () => {

    try {

      const els = await contractService.getElections()

      setElections(els)

    } catch (error) {

      toast({
        title: "Failed to load elections",
        variant: "destructive"
      })

    }

  }

  useEffect(() => {
    loadElections()
  }, [])


  /* =========================================
     Create Election
  ========================================= */

  const onCreate = async (data: ElectionForm) => {

    try {

      await contractService.createElection({
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate
      })

      toast({
        title: "Election created successfully"
      })

      setOpen(false)

      reset()

      await loadElections()

    } catch (err: any) {

      toast({
        title: err?.message || "Transaction failed",
        variant: "destructive"
      })

    }

  }


  /* =========================================
     Start / End Election
  ========================================= */

  const toggleElection = async (
    id: string,
    action: "start" | "end"
  ) => {

    setLoading(id)

    try {

      if (action === "start") {

        await contractService.startElection(id)

      } else {

        await contractService.endElection(id)

      }

      await loadElections()

      toast({
        title: action === "start"
          ? "Election started"
          : "Election ended"
      })

    } catch (err: any) {

      toast({
        title: err?.message || "Transaction failed",
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

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Elections
          </h1>

          <p className="text-muted-foreground">
            Manage blockchain elections
          </p>

        </div>


        {/* Create Election Dialog */}

        <Dialog open={open} onOpenChange={setOpen}>

          <DialogTrigger asChild>

            <Button className="glow-primary">

              <PlusCircle className="mr-2 h-4 w-4" />

              Create Election

            </Button>

          </DialogTrigger>


          <DialogContent>

            <DialogHeader>

              <DialogTitle>
                Create Election
              </DialogTitle>

            </DialogHeader>


            <form
              onSubmit={handleSubmit(onCreate)}
              className="space-y-4"
            >

              <div>

                <Label>Title</Label>

                <Input
                  {...register("title")}
                  className="mt-1"
                />

                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}

              </div>


              <div>

                <Label>Description</Label>

                <Input
                  {...register("description")}
                  className="mt-1"
                />

              </div>


              <div>

                <Label>Start Date</Label>

                <Input
                  type="datetime-local"
                  {...register("startDate")}
                  className="mt-1"
                />

              </div>


              <div>

                <Label>End Date</Label>

                <Input
                  type="datetime-local"
                  {...register("endDate")}
                  className="mt-1"
                />

              </div>


              <Button
                type="submit"
                className="w-full"
              >

                Create Election

              </Button>

            </form>

          </DialogContent>

        </Dialog>

      </div>


      {/* Elections List */}

      <div className="space-y-4">

        {elections.map(el => (

          <div
            key={el.id}
            className="glass-card p-5"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-start gap-3">

                <div className="rounded-lg bg-primary/20 p-2">

                  <Vote className="h-5 w-5 text-primary" />

                </div>

                <div>

                  <h3 className="font-semibold">
                    {el.title}
                  </h3>

                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">

                    <span>
                      {el.candidates.length} candidates
                    </span>

                    <span>
                      {el.totalVotes} votes
                    </span>

                    <span
                      className={
                        el.status === "active"
                          ? "text-green-400"
                          : el.status === "upcoming"
                          ? "text-blue-400"
                          : "text-gray-400"
                      }
                    >

                      {el.status}

                    </span>

                  </div>

                </div>

              </div>


              {/* Actions */}

              <div className="flex gap-2">

                {el.status === "upcoming" && (

                  <Button
                    size="sm"
                    onClick={() =>
                      toggleElection(el.id, "start")
                    }
                    disabled={loading === el.id}
                  >

                    <Play className="mr-1 h-3 w-3" />

                    Start

                  </Button>

                )}


                {el.status === "active" && (

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      toggleElection(el.id, "end")
                    }
                    disabled={loading === el.id}
                  >

                    <Square className="mr-1 h-3 w-3" />

                    End

                  </Button>

                )}

              </div>

            </div>

          </div>

        ))}

      </div>

    </DashboardLayout>

  )

}