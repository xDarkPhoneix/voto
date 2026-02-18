import API  from "./auth.service";


export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "ended";
  candidates: Candidate[];
  totalVotes: number;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  imageUrl: string;
  walletAddress: string;
  votes: number;
}

export const contractService = {
  async getElections(): Promise<Election[]> {
    const { data } = await API.get("/elections");
    return data;
  },

  async getElection(id: string): Promise<Election | undefined> {
    const { data } = await API.get(`/elections/${id}`);
    return data;
  },

  async createElection(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  }): Promise<Election> {
    const response = await API.post("/elections", data);
    return response.data;
  },

  async addCandidate(
    electionId: string,
    candidate: Omit<Candidate, "id" | "votes">
  ): Promise<Candidate> {
    const response = await API.post(
      `/elections/${electionId}/candidates`,
      candidate
    );
    return response.data;
  },

  async vote(
    electionId: string,
    candidateId: string,
    walletAddress: string
  ): Promise<string> {
    const response = await API.post(
      `/elections/${electionId}/vote`,
      {
        candidateId,
        walletAddress,
      }
    );

    return response.data.txHash; // backend must return { txHash: "0x..." }
  },

  async hasVoted(
    electionId: string,
    walletAddress: string
  ): Promise<boolean> {
    const { data } = await API.get(
      `/elections/${electionId}/has-voted/${walletAddress}`
    );

    return data.hasVoted; // backend must return { hasVoted: true/false }
  },

  async startElection(electionId: string): Promise<void> {
    await API.post(`/elections/${electionId}/start`);
  },

  async endElection(electionId: string): Promise<void> {
    await API.post(`/elections/${electionId}/end`);
  },

  async getWinner(electionId: string): Promise<Candidate | null> {
    const { data } = await API.get(`/elections/${electionId}/winner`);
    return data;
  },
};