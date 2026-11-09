import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["general", "project"],
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },

  timeLimit: {
    type: Number,
    required: true,
  },

  answer: {
    type: String,
    default: "",
  },

  feedback: {
    type: String,
    default: "",
  },

  score: {
    type: Number,
    default: 0,
  },

  confidence: {
    type: Number,
    default: 0,
  },

  communication: {
    type: Number,
    default: 0,
  },

  correctness: {
    type: Number,
    default: 0,
  },

  needsFollowUp: {
    type: Boolean,
    default: false,
  },

  followUpQuestion: {
    type: String,
    default: "",
  },

  followUpAnswer: {
    type: String,
    default: "",
  },

  followUpFeedback: {
    type: String,
    default: "",
  },

  followUpScore: {
    type: Number,
    default: 0,
  },

  completed: {
    type: Boolean,
    default: false,
  },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    mode: {
      type: String,
      enum: ["HR", "Technical"],
      required: true,
    },

    resumeText: {
      type: String,
      default: "",
    },

    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    questions: {
      type: [questionsSchema],
      default: [],
    },

    finalScore: {
      type: Number,
      default: 0,
    },

    averageConfidence: {
      type: Number,
      default: 0,
    },

    averageCommunication: {
      type: Number,
      default: 0,
    },

    averageCorrectness: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["incomplete", "completed"],
      default: "incomplete",
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;