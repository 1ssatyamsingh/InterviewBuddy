import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi, safeParseJson } from "../services/groq.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import generateFollowUpQuestion from "../utils/generateFollowUpQuestion.js";
import generateNextQuestion from "../utils/generateNextQuestion.js";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Only PDF files are allowed.",
      });
    }

    const filepath = req.file.path;

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `
You are an expert resume parser. Extract structured data from the resume.

Return ONLY valid JSON matching this exact structure:
{
  "role": "Target role or latest job title (e.g. Full Stack Developer)",
  "experience": "Brief experience summary (e.g. 2 years, Fresher, or Intern)",
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief 1-2 sentence description"
    }
  ],
  "skills": ["Skill 1", "Skill 2"]
}

Rules:
- Keep the 'experience' value concise (maximum 10 words, e.g. '1 year experience', 'Fresher', 'Intern').
- Keep project descriptions under 2 sentences each.
- Include up to 25 primary technical skills in 'skills'.
- Return ONLY the JSON object. Do not add markdown or explanations.
`,
      },
      {
        role: "user",
        content: resumeText.slice(0, 10000),
      },
    ];

    const aiResponse = await askAi(messages, { max_tokens: 4096 });

    // console.log("========== AI RESPONSE ==========");
    // console.log(aiResponse);
    // console.log("================================");

    // if (!aiResponse) {
    //   return res.status(500).json({
    //     message: "No response from AI.",
    //   });
    // }

    let parsed;

    try {
      parsed = safeParseJson(aiResponse);
      console.log("Parsed resume data:", parsed);

      // Provide sensible defaults if fields are missing or not arrays
      if (!parsed.role) parsed.role = "Software Developer";
      if (!parsed.experience) parsed.experience = "Fresher";
      if (!Array.isArray(parsed.projects)) {
        parsed.projects = typeof parsed.projects === "object" && parsed.projects !== null ? [parsed.projects] : [];
      }
      if (!Array.isArray(parsed.skills)) {
        parsed.skills = typeof parsed.skills === "string" ? parsed.skills.split(",").map(s => s.trim()) : [];
      }
    } catch (parseErr) {
      console.error("Resume JSON Parse Error:", parseErr.message);
      return res.status(500).json({
        message: "Failed to parse resume structured data.",
      });
    }

    await fs.promises.unlink(filepath);

    return res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText,
    });
  } catch (error) {
    console.error("Resume Analysis Error:", error.message);

    if (req.file && fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path);
    }

    return res.status(500).json({ message: error.message });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, Experience and Mode are required.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.credits < 1) {
      return res.status(400).json({
        message: "Not enough credits.",
      });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

    const skillsText =
      Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `
Role: ${role}
Experience: ${experience}
Interview Mode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
`;

    const messages = [
      {
        role: "system",
        content: `
You are an experienced technical interviewer.

Generate ONLY ONE interview question.

Rules:
- Generate exactly one question.
- Do not number it.
- Do not add explanations.
- The question should be easy.
- Maximum 25 words.
- Return only the question text.

If projects or resume contain useful information, prefer asking about them.
Otherwise ask a general interview question.
`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({
        message: "AI failed to generate question.",
      });
    }

    const firstQuestion = aiResponse.trim();

    const questionType =
      projectText !== "None" || safeResume !== "None" ? "project" : "general";

    user.credits -= 1;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,

      currentQuestionIndex: 0,

      questions: [
        {
          question: firstQuestion,
          type: questionType,
          difficulty: "easy",
          timeLimit: 60,
        },
      ],
    });

    return res.status(201).json({
      interviewId: interview._id,
      questions: interview.questions,
      creditsLeft: user.credits,
      userName: user.name,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create interview.",
    });
  }
};

export const submitAnswer = async (req, res) => {

  try {
    const { interviewId, questionIndex, answer, timeTaken, isFollowUp } =
      req.body;

    const interview = await Interview.findById(interviewId);
    const question = interview.questions[questionIndex];
    const skipped = !answer.trim();

    if (isFollowUp) {
      const messages = [
        {
          role: "system",
          content: `
  You are evaluating ONLY the follow-up answer.
  
  Return JSON:
  
  {
   "finalScore":0,
   "feedback":""
  }
  `,
        },
        {
          role: "user",
          content: `
  Original Question:
  ${question.question}
  
  Follow-up Question:
  ${question.followUpQuestion}
  
  Follow-up Answer:
  ${answer}
  `,
        },
      ];

      const aiResponse = await askAi(messages);

      const parsed = safeParseJson(aiResponse);

      question.followUpAnswer = answer;
      question.followUpFeedback = parsed.feedback;
      question.followUpScore = parsed.finalScore;
      question.completed = true;

      // duplicate is here
      let nextDifficulty = question.difficulty;

      if (question.followUpScore >= 8) {
        if (question.difficulty === "easy") nextDifficulty = "medium";
        else if (question.difficulty === "medium") nextDifficulty = "hard";
      } else if (question.followUpScore <= 4) {
        if (question.difficulty === "hard") nextDifficulty = "medium";
        else if (question.difficulty === "medium") nextDifficulty = "easy";
      }



      await interview.save();

      const completedQuestions = interview.questions.filter(
        (q) => q.completed,
      ).length;

      if (completedQuestions >= 5) {
        interview.status = "completed";

        await interview.save();

        return res.status(200).json({
          interviewCompleted: true,
        });
      }

      const nextQuestion = await generateNextQuestion(
        interview.role,
        interview.experience,
        interview.mode,
        interview.resumeText,
        nextDifficulty,
        question.question,
        answer,
        question.followUpScore,
      );

      interview.questions.push({
        question: nextQuestion,
        type: question.type, // carry forward the interview type
        difficulty: nextDifficulty,
        timeLimit: question.timeLimit,
        completed: false,
      });

      interview.currentQuestionIndex = interview.questions.length - 1;

      await interview.save();

      return res.status(200).json({
        feedback: parsed.feedback,
        score: question.followUpScore,

        needsFollowUp: false,

        nextQuestion: {
          index: interview.currentQuestionIndex,
          question: nextQuestion,
          difficulty: nextDifficulty,
        },

        interviewCompleted: false,
      });
    }

    // If no answer


    // If time exceeded
    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;

      await interview.save();

      return res.json({
        feedback: question.feedback,
      });
    }

    if (skipped) {
      question.answer = "";
      question.feedback = "You did not submit an answer.";
      question.score = 0;

      question.confidence = 0;
      question.communication = 0;
      question.correctness = 0;

      question.timeTaken = timeTaken;
      question.needsFollowUp = false;
      question.completed = true;
    }

    const messages = [
      {
        role: "system",
        content: `
You are an experienced technical interviewer evaluating a candidate's answer.

Evaluate the answer fairly.

Give scores from 0 to 10.

Scoring Criteria:

1. Confidence
2. Communication
3. Correctness

Calculate:

finalScore = average of the above scores (rounded).

Now decide whether the answer requires a follow-up question.

Return:

needsFollowUp = true

if:

- the answer is incomplete
- partially correct
- lacks depth
- misses important points
- needs clarification

Return:

needsFollowUp = false

if:

- the answer is complete
- technically correct
- clearly explained
- no clarification is required

Feedback:
- Maximum 15 words.
- Professional.
- Helpful.

Return ONLY JSON.

{
 "confidence":0,
 "communication":0,
 "correctness":0,
 "finalScore":0,
 "feedback":"",
 "needsFollowUp":false
}
`,
      },
      {
        role: "user",
        content: `
Question: ${question.question}
Answer: ${answer}
`,
      },
    ];

    let parsed;

    if (skipped) {
      parsed = {
        confidence: 0,
        communication: 0,
        correctness: 0,
        finalScore: 0,
        feedback: "You did not submit an answer.",
        needsFollowUp: false,
      };
    } else {
      const aiResponse = await askAi(messages);
      parsed = safeParseJson(aiResponse);
    }

    question.answer = answer;
    question.feedback = parsed.feedback;
    question.score = parsed.finalScore;

    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;

    question.timeTaken = timeTaken;
    question.needsFollowUp = parsed.needsFollowUp;

    if (parsed.needsFollowUp) {
      const followUp = await generateFollowUpQuestion(
        question.question,
        answer,
        parsed.feedback,
      );

      question.followUpQuestion = followUp;

      await interview.save();

      return res.status(200).json({
        feedback: parsed.feedback,
        score: parsed.score,
        confidence: parsed.confidence,
        communication: parsed.communication,
        correctness: parsed.correctness,
        needsFollowUp: true,
        followUpQuestion: followUp,
      });
    }

    question.completed = true;

    // Decide next difficulty
    let nextDifficulty = question.difficulty;

    if (parsed.finalScore >= 8) {
      if (question.difficulty === "easy") nextDifficulty = "medium";
      else if (question.difficulty === "medium") nextDifficulty = "hard";
    } else if (parsed.finalScore <= 4) {
      if (question.difficulty === "hard") nextDifficulty = "medium";
      else if (question.difficulty === "medium") nextDifficulty = "easy";
    }

    const completedQuestions = interview.questions.filter(
      (q) => q.completed,
    ).length;

    if (completedQuestions >= 5) {
      interview.status = "completed";

      await interview.save();

      return res.status(200).json({
        interviewCompleted: true,
      });
    }

    const nextQuestion = await generateNextQuestion(
      interview.role,
      interview.experience,
      interview.mode,
      interview.resumeText,
      nextDifficulty,
      question.question,
      answer,
      parsed.finalScore,
    );

    interview.questions.push({
      question: nextQuestion,
      type: question.type, // carry forward the interview type
      difficulty: nextDifficulty,
      timeLimit: question.timeLimit,
      completed: false,
    });

    interview.currentQuestionIndex = interview.questions.length - 1;

    await interview.save();

    return res.status(200).json({
      feedback: parsed.feedback,
      score: parsed.finalScore,
      confidence: parsed.confidence,
      communication: parsed.communication,
      correctness: parsed.correctness,
      needsFollowUp: false,

      nextQuestion: {
        index: interview.currentQuestionIndex,
        question: nextQuestion,
        difficulty: nextDifficulty,
      },

      interviewCompleted: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to submit answer ${error}` });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(400).json({ message: "failed to find Interview" });
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to finish Interview ${error}` });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to find currentUser Interview ${error}` });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });
    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: `failed to find currentUser Interview report ${error}`,
    });
  }
};

export const clearInterviewHistory = async (req, res) => {
  try {
    const userId = req.userId;

    await Interview.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: "Interview history cleared successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear interview history.",
    });
  }
};