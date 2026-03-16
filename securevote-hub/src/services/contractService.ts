/**
 * Election Service
 * Handles API + Blockchain interaction
 */

import API from "./auth.service"
import { ethers } from "ethers"
import contractABI from "@/abi/Voting.json"

/* ---------------- CONFIG ---------------- */

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

if (!CONTRACT_ADDRESS) {
  throw new Error("Missing VITE_CONTRACT_ADDRESS in environment")
}


/* ---------------- TYPES ---------------- */

export interface Candidate {
  id: number
  name: string
  party: string
  imageUrl?: string
  walletAddress: string
  votes: number
}

export interface Election {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "ended"
  candidates: Candidate[]
  totalVotes: number
  blockchainId?: number | null
}


/* ---------------- NORMALIZERS ---------------- */

function normalizeCandidate(c: any): Candidate {
  return {
    ...c,
    id: Number(c.id),
    walletAddress: c.walletAddress?.toLowerCase(),
    votes: Number(c.votes || 0)
  }
}

function normalizeElection(raw: any): Election {
  return {
    ...raw,
    id: String(raw._id ?? raw.id),
    candidates: (raw.candidates || []).map(normalizeCandidate)
  }
}


/* ---------------- PROVIDER ---------------- */

function getProvider() {

  const ethereum = (window as any).ethereum

  if (!ethereum) {
    throw new Error("MetaMask not installed")
  }

  return new ethers.BrowserProvider(ethereum)
}


/* ---------------- SIGNER ---------------- */

async function getVerifiedSigner(expectedWallet?: string) {

  const provider = getProvider()

  const accounts = await provider.send("eth_requestAccounts", [])

  if (!accounts?.length) {
    throw new Error("No wallet connected")
  }

  const activeWallet = accounts[0].toLowerCase()

  if (
    expectedWallet &&
    activeWallet !== expectedWallet.toLowerCase()
  ) {
    throw new Error(
      `Wrong wallet connected. Switch to: ${expectedWallet}`
    )
  }

  return provider.getSigner()
}


/* ---------------- CONTRACT HELPERS ---------------- */

async function getContract(expectedWallet?: string) {

  const signer = await getVerifiedSigner(expectedWallet)

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    contractABI.abi,
    signer
  )
}

async function getReadContract() {

  const provider = getProvider()

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    contractABI.abi,
    provider
  )
}


/* ---------------- SERVICE ---------------- */

export const contractService = {


  /* -------- GET ALL ELECTIONS -------- */

  async getElections(): Promise<Election[]> {

    const res = await API.get("/elections")

    return (res.data?.data || []).map(normalizeElection)

  },


  /* -------- GET SINGLE ELECTION -------- */

  async getElection(id: string): Promise<Election> {

    const res = await API.get(`/elections/${id}`)

    return normalizeElection(res.data?.data)

  },


  /* -------- CREATE ELECTION -------- */

  async createElection(data: {
    title: string
    description: string
    startDate: string
    endDate: string
  }): Promise<Election> {

    const res = await API.post("/elections", data)

    return normalizeElection(res.data?.data)

  },


  /* -------- ADD CANDIDATE -------- */

  async addCandidate(
    electionId: string,
    candidate: {
      name: string
      party: string
      imageUrl?: string
      walletAddress: string
    }
  ): Promise<Candidate> {

    const res = await API.post(
      `/elections/${electionId}/candidates`,
      {
        ...candidate,
        walletAddress: candidate.walletAddress.toLowerCase()
      }
    )

    return normalizeCandidate(res.data?.data)

  },


  /* -------- CAST VOTE (BLOCKCHAIN) -------- */

  async vote(
    blockchainElectionId: number,
    candidateId: number
  ): Promise<string> {

    const walletRes = await API.get("/users/me")

    const registeredWallet =
      walletRes.data?.user?.walletAddress?.toLowerCase()

    const contract = await getContract(registeredWallet)

    const tx = await contract.vote(
      blockchainElectionId,
      candidateId
    )

    const receipt = await tx.wait()

    return receipt.hash
  },


  /* -------- RECORD VOTE IN BACKEND -------- */

  async recordVote(
    electionId: string,
    candidateId: number,
    walletAddress: string,
    txHash: string
  ): Promise<void> {

    await API.post(`/elections/${electionId}/vote`, {
      candidateId,
      walletAddress: walletAddress.toLowerCase(),
      txHash
    })

  },


  /* -------- GET CANDIDATE VOTES (BLOCKCHAIN) -------- */

  async getCandidateVotes(
    blockchainElectionId: number,
    candidateId: number
  ): Promise<number> {

    const contract = await getReadContract()

    const candidate = await contract.getCandidate(
      blockchainElectionId,
      candidateId
    )

    return Number(candidate[5]) // votes
  },


  /* -------- START ELECTION -------- */

  async startElection(electionId: string): Promise<void> {

    await API.post(`/elections/${electionId}/start`)

  },


  /* -------- END ELECTION -------- */

  async endElection(electionId: string): Promise<void> {

    await API.post(`/elections/${electionId}/end`)

  },


  /* -------- GET WINNER -------- */

  async getWinner(
    electionId: string
  ): Promise<{ winnerId: number; votes: number }> {

    const res = await API.get(`/elections/${electionId}/winner`)

    return {
      winnerId: Number(res.data?.winnerId),
      votes: Number(res.data?.votes)
    }

  },


  /* -------- HAS VOTED -------- */

  async hasVoted(
    electionId: string,
    walletAddress?: string | null
  ): Promise<boolean> {

    if (!walletAddress) return false

    const res = await API.get(
      `/elections/${electionId}/has-voted/${walletAddress.toLowerCase()}`
    )

    return res.data?.voted === true

  }

}