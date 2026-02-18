import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Candidate Schema (Embedded)
 */
const candidateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    party: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
  },
  { _id: true } // automatically creates candidate id
);

/**
 * Election Schema
 */
const electionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    candidates: [candidateSchema],
    voters: [
      {
        type: String, // walletAddress
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Convert _id to id (match frontend)
 */
electionSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    // Convert candidate _id to id
    if (ret.candidates) {
      ret.candidates = ret.candidates.map((c) => {
        c.id = c._id.toString();
        delete c._id;
        return c;
      });
    }

    return ret;
  },
});

export const Election = mongoose.model("Election", electionSchema);
