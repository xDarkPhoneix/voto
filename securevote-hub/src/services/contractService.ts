import { ethers } from "ethers"
import VotingABI from "../abi/Voting.json"

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string

declare global {
  interface Window {
    ethereum?: any
  }
}

/* =====================================
   Types
===================================== */

export interface Candidate {
  id: string
  name: string
  party: string
  imageUrl: string
  walletAddress: string
  votes: number
}

export interface Election {
  id: string
  title: string
  description: string
  startDate: number
  endDate: number
  status: "upcoming" | "active" | "ended"
  totalVotes: number
  candidates: Candidate[]
}

/* =====================================
   Provider
===================================== */

const getProvider = async () => {

  if (!window.ethereum) {
    throw new Error("MetaMask not installed")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)

  await provider.send("eth_requestAccounts", [])

  return provider
}

const getContract = async () => {

  const provider = await getProvider()

  const signer = await provider.getSigner()

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    VotingABI.abi,
    signer
  )
}

/* =====================================
   Helper
===================================== */

const getStatus = (start:number,end:number) => {

  const now = Date.now()/1000

  if(now < start) return "upcoming"

  if(now > end) return "ended"

  return "active"
}

/* =====================================
   Contract Service
===================================== */

export const contractService = {

  /* =====================================
     Fetch Elections + Candidates
  ===================================== */

  async getElections(): Promise<Election[]> {

    const contract = await getContract()

    const count = Number(await contract.electionCount())

    const elections: Election[] = []

    for(let i=1;i<=count;i++){

      const e = await contract.getElection(i)

      const candidates: Candidate[] = []

      for(let j=1;j<=Number(e.candidateCount);j++){

        const c = await contract.getCandidate(i,j)

        candidates.push({
          id: String(c.id),
          name: c.name,
          party: c.party,
          imageUrl: c.imageUrl,
          walletAddress: c.walletAddress,
          votes: Number(c.votes)
        })

      }

      elections.push({
        id: String(e.id),
        title: e.title,
        description: e.description,
        startDate: Number(e.startDate),
        endDate: Number(e.endDate),
        status: getStatus(Number(e.startDate),Number(e.endDate)),
        totalVotes: Number(e.totalVotes),
        candidates
      })
    }

    return elections
  },

  /* =====================================
     Create Election
  ===================================== */

  async createElection(data:{
    title:string
    description:string
    startDate:string
    endDate:string
  }) {

    const contract = await getContract()

    const start = Math.floor(new Date(data.startDate).getTime()/1000)
    const end = Math.floor(new Date(data.endDate).getTime()/1000)

    const tx = await contract.createElection(
      data.title,
      data.description,
      start,
      end
    )

    await tx.wait()
  },

  /* =====================================
     Add Candidate
  ===================================== */

  async addCandidate(
    electionId:string,
    data:{
      name:string
      party:string
      imageUrl:string
      walletAddress:string
    }
  ){

    const contract = await getContract()

    const tx = await contract.addCandidate(
      electionId,
      data.name,
      data.party,
      data.imageUrl,
      data.walletAddress
    )

    await tx.wait()
  },

  /* =====================================
     Start Election
  ===================================== */

  async startElection(id:string){

    const contract = await getContract()

    const tx = await contract.startElection(id)

    await tx.wait()
  },

  /* =====================================
     End Election
  ===================================== */

  async endElection(id:string){

    const contract = await getContract()

    const tx = await contract.endElection(id)

    await tx.wait()
  },

  /* =====================================
     Vote
  ===================================== */

  async vote(
    electionId:string,
    candidateId:string
  ):Promise<string>{

    const contract = await getContract()

    const tx = await contract.vote(
      electionId,
      candidateId
    )

    const receipt = await tx.wait()

    return receipt.hash
  },

  /* =====================================
     Has Voted
  ===================================== */

  async hasVoted(
    electionId:string,
    address:string
  ){

    const contract = await getContract()

    return await contract.hasVoted(
      electionId,
      address
    )
  },

  /* =====================================
     Get Winner
  ===================================== */

  async getWinner(electionId:string){

    const contract = await getContract()

    const result = await contract.getWinner(electionId)

    return {
      winnerId:Number(result[0]),
      votes:Number(result[1])
    }
  }

}