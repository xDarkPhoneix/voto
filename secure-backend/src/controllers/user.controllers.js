import { User } from "../models/user.model.js"


/* =====================================================
   LOGIN USER
   POST /api/auth/login
===================================================== */

export const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    const userData = user.toObject()
    delete userData.password
    delete userData.refreshToken

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userData,
        accessToken
      }
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}


/* =====================================================
   REGISTER USER
   POST /api/auth/register
===================================================== */

export const registerUser = async (req, res) => {

  try {

    const {
      fullName,
      email,
      aadhaarId,
      role,
      password,
      walletAddress
    } = req.body

    if (
      !fullName ||
      !email ||
      !aadhaarId ||
      !role ||
      !password ||
      !walletAddress
    ) {

      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })

    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        { aadhaarId },
        { walletAddress }
      ]
    })

    if (existingUser) {

      return res.status(409).json({
        success: false,
        message: "User already exists"
      })

    }

    const user = await User.create({
      fullName,
      email,
      aadhaarId,
      role,
      password,
      walletAddress,
      isApproved: role === "admin" ? true : null
    })

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    const userData = user.toObject()
    delete userData.password
    delete userData.refreshToken

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userData,
        accessToken
      }
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}


/* =====================================================
   GET ALL VOTERS
   GET /api/users/voters
===================================================== */

export const getVoters = async (req, res) => {

  try {

    const voters = await User
      .find({ role: "voter" })
      .select("-password -refreshToken")

    return res.status(200).json({
      success: true,
      voters
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}


/* =====================================================
   APPROVE / REJECT VOTER
   POST /api/users/:id/approve
===================================================== */

export const approveVoter = async (req, res) => {

  try {

    const { approved } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found"
      })

    }

    if (user.role !== "voter") {

      return res.status(400).json({
        success: false,
        message: "Only voters can be approved"
      })

    }

    user.isApproved = approved

    await user.save()

    return res.status(200).json({
      success: true,
      message: approved
        ? "Voter approved successfully"
        : "Voter rejected"
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}