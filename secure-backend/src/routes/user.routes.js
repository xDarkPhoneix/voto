import { Router } from "express";
import { approveVoter, getVoters, loginUser, registerUser } from "../controllers/user.controllers.js";


const router=Router()

router.route("/register").post(registerUser)
 router.route("/login").post(loginUser)
 router.get("/voters", getVoters)
router.post("/:id/approve", approveVoter)


 

export default router