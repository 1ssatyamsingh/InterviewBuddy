import { askAi } from "../services/groq.service.js";

const generateNextQuestion = async (
  role,
  experience,
  mode,
  resumeText,
  difficulty,
  previousQuestion,
  previousAnswer,
  previousScore
) => {
  const messages = [
    {
      role: "system",
      content: `
You are an experienced interviewer.

Generate ONLY ONE interview question.

Rules:
- Return only the question.
- Maximum 25 words.
- Do not number the question.
- Difficulty: ${difficulty}
- Avoid repeating previous questions.
- Prefer asking from the candidate's resume if available.
`,
    },
    {
      role: "user",
      content: `
Role: ${role}

Experience: ${experience}

Interview Mode: ${mode}

Resume:
${resumeText}

Previous Question:
${previousQuestion}

Candidate Answer:
${previousAnswer}

Previous Score:
${previousScore}
`,
    },
  ];

  const response = await askAi(messages);

  return response.trim();
};

export default generateNextQuestion;