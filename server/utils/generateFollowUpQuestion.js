import { askAi } from "../services/groq.service.js";

const generateFollowUpQuestion = async (question, answer, feedback) => {
  const messages = [
    {
      role: "system",
      content: `

You are conducting a technical interview.

Generate exactly ONE follow-up question.

STRICT RULES:

- Return ONLY the follow-up question.
- Maximum 20 words.
- No explanations.
- No praise.
- No transition sentences.
- No markdown.
- No numbering.
- End immediately after the question mark.
 Return only the question.
`,
    },
    {
      role: "user",
      content: `
Original Question:
${question}

Candidate Answer:
${answer}

Feedback:
${feedback}
`,
    },
  ];

  const response = await askAi(messages);

  return response.trim();
};

export default generateFollowUpQuestion;
