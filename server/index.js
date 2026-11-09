import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/connectDb.js"
import cookieParser from "cookie-parser"
dotenv.config()
import cors from "cors"
import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
import paymentRouter from "./routes/payment.route.js"
import ttsRouter from "./routes/tts.route.js";

const app = express()
app.set("trust proxy", 1);

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = rawClientUrl
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (process.env.NODE_ENV !== "production" && isLocalhost) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes(normalizedOrigin) ||
        (allowedOrigins.some((u) => u.includes("vercel.app")) && normalizedOrigin.endsWith(".vercel.app"))
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("InterviewBuddy Backend is running 🚀");
});

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth" , authRouter)
app.use("/api/user", userRouter)
app.use("/api/interview" , interviewRouter)
app.use("/api/payment" , paymentRouter)
app.use("/api/tts", ttsRouter);

const PORT = process.env.PORT || 8080
const startServer = async () => {
    try {
      await connectDb();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to connect to database:", error);
      process.exit(1);
    }
  };
  
  startServer();
