import express from "express";
import { addCandidate, createElection, endElection, getElection, getElections, getWinner, hasVoted, startElection, vote } from "../controllers/contract.controllers.js";

const router = express.Router();

router.get("/", getElections);
router.get("/:id", getElection);
router.post("/", createElection);

router.post("/:id/candidates", addCandidate);
router.post("/:id/vote", vote);

router.get("/:id/has-voted/:wallet", hasVoted);

router.post("/:id/start", startElection);
router.post("/:id/end", endElection);

router.get("/:id/winner", getWinner);

export default router;
