import { Election } from "../models/election.model.js";

/**
 * GET /api/elections
 */
export const getElections = async (req, res, next) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/elections/:id
 */
export const getElection = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    res.json(election);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/elections
 */
export const createElection = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
    });

    res.status(201).json(election);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/elections/:id/candidates
 */
export const addCandidate = async (req, res, next) => {
  try {
    const { name, party, imageUrl, walletAddress } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    election.candidates.push({
      name,
      party,
      imageUrl,
      walletAddress,
    });

    await election.save();

    const newCandidate =
      election.candidates[election.candidates.length - 1];

    res.status(201).json(newCandidate);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/elections/:id/vote
 */
export const vote = async (req, res, next) => {
  try {
    const { candidateId, walletAddress } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (election.status !== "active") {
      return res.status(400).json({ message: "Election is not active" });
    }

    if (election.voters.includes(walletAddress.toLowerCase())) {
      return res.status(400).json({ message: "You have already voted" });
    }

    const candidate = election.candidates.id(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.votes += 1;
    election.totalVotes += 1;
    election.voters.push(walletAddress.toLowerCase());

    await election.save();

    const txHash =
      "0x" + Math.random().toString(16).slice(2) + Date.now();

    res.json({ txHash });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/elections/:id/has-voted/:wallet
 */
export const hasVoted = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const hasVoted = election.voters.includes(
      req.params.wallet.toLowerCase()
    );

    res.json({ hasVoted });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/elections/:id/start
 */
export const startElection = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    election.status = "active";
    await election.save();

    res.json({ message: "Election started" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/elections/:id/end
 */
export const endElection = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    election.status = "ended";
    await election.save();

    res.json({ message: "Election ended" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/elections/:id/winner
 */
export const getWinner = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (!election.candidates.length) {
      return res.json(null);
    }

    const winner = election.candidates.reduce((max, c) =>
      c.votes > max.votes ? c : max
    );

    res.json(winner);
  } catch (error) {
    next(error);
  }
};
