import { Election } from "../models/election.model.js"
import { contract } from "../utils/blockchain.js"


/* =====================================================
   GET ALL ELECTIONS
   GET /api/elections
===================================================== */

export const getElections = async (req, res, next) => {

  try {

    const elections = await Election
      .find()
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: elections
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   GET SINGLE ELECTION
   GET /api/elections/:id
===================================================== */

export const getElection = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    return res.status(200).json({
      success: true,
      data: election
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   CREATE ELECTION
   POST /api/elections
===================================================== */

export const createElection = async (req, res, next) => {

  try {

    const { title, description, startDate, endDate } = req.body

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date and end date are required"
      })
    }

    const start = Math.floor(new Date(startDate).getTime() / 1000)
    const end = Math.floor(new Date(endDate).getTime() / 1000)

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      })
    }

    /* Create election on blockchain */

    const tx = await contract.createElection(
      title,
      description || "",
      start,
      end
    )

    const receipt = await tx.wait()

    const blockchainElectionId =
      receipt?.logs?.[0]?.args?.electionId ?? null


    /* Save in database */

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      blockchainId: blockchainElectionId,
      status: "upcoming"
    })


    return res.status(201).json({
      success: true,
      data: election
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   ADD CANDIDATE
   POST /api/elections/:id/candidates
===================================================== */

export const addCandidate = async (req, res, next) => {

  try {

    const { name, party, imageUrl, walletAddress } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Candidate name is required"
      })
    }

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    /* Save candidate in database */

    election.candidates.push({
      name,
      party,
      imageUrl,
      walletAddress
    })

    await election.save()

    const candidate =
      election.candidates[election.candidates.length - 1]


    /* Add candidate to blockchain */

    const tx = await contract.addCandidate(
      election.blockchainId,
      name
    )

    await tx.wait()


    return res.status(201).json({
      success: true,
      data: candidate
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   CAST VOTE
   POST /api/elections/:id/vote
===================================================== */

export const vote = async (req, res, next) => {

  try {

    const { candidateId } = req.body

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID is required"
      })
    }

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    const tx = await contract.vote(
      election.blockchainId,
      candidateId
    )

    const receipt = await tx.wait()

    return res.status(200).json({
      success: true,
      txHash: receipt.hash,
      message: "Vote recorded on blockchain"
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   CHECK IF USER HAS VOTED
   GET /api/elections/:id/has-voted/:wallet
===================================================== */

export const hasVoted = async (req, res, next) => {

  try {

    const { id, wallet } = req.params

    const election = await Election.findById(id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    const voted = await contract.hasVoted(
      election.blockchainId,
      wallet
    )

    return res.status(200).json({
      success: true,
      hasVoted: voted
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   START ELECTION
   POST /api/elections/:id/start
===================================================== */

export const startElection = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    const tx = await contract.startElection(
      election.blockchainId
    )

    await tx.wait()

    election.status = "active"

    await election.save()

    return res.status(200).json({
      success: true,
      message: "Election started successfully"
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   END ELECTION
   POST /api/elections/:id/end
===================================================== */

export const endElection = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    const tx = await contract.endElection(
      election.blockchainId
    )

    await tx.wait()

    election.status = "ended"

    await election.save()

    return res.status(200).json({
      success: true,
      message: "Election ended successfully"
    })

  } catch (error) {
    next(error)
  }

}


/* =====================================================
   GET WINNER
   GET /api/elections/:id/winner
===================================================== */

export const getWinner = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    const result = await contract.getWinner(
      election.blockchainId
    )

    return res.status(200).json({
      success: true,
      winnerId: Number(result[0]),
      votes: Number(result[1])
    })

  } catch (error) {
    next(error)
  }

}