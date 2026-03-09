import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { contractService, Election } from "@/services/contractService"
import { useWallet } from "@/hooks/useWallet"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

import {
  Vote,
  CheckCircle,
  Loader2,
  AlertTriangle
} from "lucide-react"


export default function VoterElections() {

  const [elections, setElections] = useState<Election[]>([])
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set())
  const [votingCandidate, setVotingCandidate] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const wallet = useWallet()


  /* =========================================
     Load Elections
  ========================================= */

  const loadElections = async () => {

    try {

      const data = await contractService.getElections()

      setElections(data)

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
     Check If User Already Voted
  ========================================= */

  useEffect(() => {

    if (!wallet.address || elections.length === 0) return

    const checkVotes = async () => {

      const votedSet = new Set<string>()

      for (const el of elections) {

        try {

          const voted = await contractService.hasVoted(
            el.id,
            wallet.address
          )

          if (voted) votedSet.add(el.id)

        } catch (err) {

          console.error("Vote check failed", err)

        }

      }

      setVotedElections(votedSet)

    }

    checkVotes()

  }, [elections, wallet.address])


  /* =========================================
     Vote
  ========================================= */

  const handleVote = async (
    electionId: string,
    candidateId: string
  ) => {

    if (!wallet.isConnected) {

      toast({
        title: "Connect your wallet first",
        variant: "destructive"
      })

      return
    }

    setVotingCandidate(candidateId)
    setTxHash(null)

    try {

      const hash = await contractService.vote(
        electionId,
        candidateId
      )

      setTxHash(hash)

      setVotedElections(prev => {
        const updated = new Set(prev)
        updated.add(electionId)
        return updated
      })

      toast({
        title: "Vote submitted to blockchain"
      })

      await loadElections()

    } catch (err: any) {

      toast({
        title: err?.message || "Transaction failed",
        variant: "destructive"
      })

    }

    setVotingCandidate(null)

  }


  /* =========================================
     Active Elections
  ========================================= */

  const activeElections =
    elections.filter(e => e.status === "active")


  /* =========================================
     UI
  ========================================= */

  return (

    <DashboardLayout role="voter">

      {/* Header */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          Elections
        </h1>

        <p className="text-muted-foreground">
          View candidates and cast your vote
        </p>

      </div>


      {/* Wallet Warning */}

      {!wallet.isConnected && (

        <div className="mb-6 glass-card flex items-center gap-3 p-4">

          <AlertTriangle className="h-5 w-5 text-yellow-400" />

          <p className="text-sm">
            Connect your wallet to vote
          </p>

          <Button
            size="sm"
            onClick={wallet.connect}
            className="ml-auto"
          >

            Connect Wallet

          </Button>

        </div>

      )}


      {/* Transaction Info */}

      {txHash && (

        <div className="mb-6 glass-card border-l-4 border-green-500 p-4">

          <p className="text-sm font-medium">
            Transaction submitted
          </p>

          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
            Tx: {txHash}
          </p>

        </div>

      )}


      {/* Elections */}

      {activeElections.map(el => (

        <div key={el.id} className="mb-8">

          <div className="mb-4 flex items-center gap-3">

            <div className="rounded-lg bg-primary/20 p-2">
              <Vote className="h-5 w-5 text-primary" />
            </div>

            <div>

              <h2 className="text-xl font-semibold">
                {el.title}
              </h2>

              <p className="text-sm text-muted-foreground">
                {el.description}
              </p>

            </div>


            {votedElections.has(el.id) && (

              <span className="ml-auto flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">

                <CheckCircle className="h-3 w-3" />

                Voted

              </span>

            )}

          </div>


          {/* Candidates */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {el.candidates.map(c => (

              <div key={c.id} className="glass-card-hover p-5">

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">

                  {c.name.charAt(0)}

                </div>

                <h3 className="font-semibold">
                  {c.name}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {c.party}
                </p>

                <p className="mt-2 font-mono text-xs text-muted-foreground">

                  {c.walletAddress?.slice(0,6)}...
                  {c.walletAddress?.slice(-4)}

                </p>


                <Button
                  className="mt-4 w-full"
                  disabled={
                    votedElections.has(el.id) ||
                    votingCandidate !== null ||
                    !wallet.isConnected
                  }
                  onClick={() =>
                    handleVote(el.id, c.id)
                  }
                >

                  {votingCandidate === c.id ? (

                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>

                  ) : votedElections.has(el.id) ? (

                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Voted
                    </>

                  ) : (

                    <>
                      <Vote className="mr-2 h-4 w-4" />
                      Vote
                    </>

                  )}

                </Button>

              </div>

            ))}

          </div>

        </div>

      ))}


      {/* No Active Elections */}

      {activeElections.length === 0 && (

        <div className="glass-card py-16 text-center">

          <Vote className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />

          <p className="text-lg font-medium">
            No active elections
          </p>

          <p className="text-sm text-muted-foreground">
            Check back later
          </p>

        </div>

      )}

    </DashboardLayout>

  )

}