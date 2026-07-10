import { generateGeminiText, isGeminiConfigured } from "../services/gemini.service.js";

const getTemplateReply = (message = "") => {
  const text = message.toLowerCase();

  if (text.includes("screen") || (text.includes("candidate") && text.includes("question"))) {
    return `Here are 10 candidate screening questions:
1. What interested you in this role?
2. Which of the required skills have you used in real projects?
3. Can you describe one relevant project from start to finish?
4. What tools, frameworks, or platforms are you strongest with?
5. How many months or years of relevant experience do you have?
6. What type of work environment do you perform best in?
7. Are you available for the job location, timing, or shift requirements?
8. What is your notice period or how soon can you join?
9. What salary or stipend range are you expecting?
10. Why should we shortlist you for the next round?

If you want, I can also give:
* screening questions for freshers
* technical screening questions
* HR screening questions
* role-specific questions for frontend, backend, sales, support, or design`;
  }

  if (text.includes("resume")) {
    return `Here is a practical resume checklist:
* Add a short summary tailored to the role.
* List your key skills near the top.
* Highlight 2 to 4 strong projects with impact.
* Mention internships, certifications, and achievements.
* Keep formatting clean and easy to scan.
* Use keywords from the job description.
* For freshers, keep it to one page if possible.

If you want, I can also give you a fresher resume format.`;
  }

  if (text.includes("interview")) {
    return `Here are common interview prep points:
* Prepare a 30 to 60 second self introduction.
* Revise your top projects, internships, and achievements.
* Practice role-specific questions.
* Answer with examples from your own work.
* Be ready for strengths, weaknesses, and career-goal questions.
* Prepare 2 to 3 questions to ask the interviewer.

If you want, I can give you mock interview questions too.`;
  }

  if (text.includes("cover")) {
    return `Here is a simple cover letter structure:
* Start with the role you are applying for.
* Explain why you are interested in the company or role.
* Mention the most relevant skills, projects, or experience.
* Add one line on how you can contribute.
* End politely with interest in the next step.

If you want, I can write a sample cover letter for you.`;
  }

  if (text.includes("post") || text.includes("recruiter")) {
    return `A good job post should include:
* Job title
* Key responsibilities
* Required skills
* Experience level
* Location or remote policy
* Salary range if available
* Selection process
* Application deadline or next step

If you want, I can draft a full job post for a specific role.`;
  }

  if (text.includes("apply")) {
    return `To apply effectively:
* Read the full job description.
* Match your resume to the role.
* Keep your profile updated.
* Apply with a clean resume and correct links.
* Prepare a short introduction in case a recruiter calls.

If you want, I can also help you tailor your application.`;
  }

  return null;
};

const fallbackReply = (message = "") =>
  getTemplateReply(message) ||
  "Hi, I am JobMate. I help job seekers with applications, resumes, interviews, and recruiters with job descriptions and candidate screening. Ask me about a resume, interview, cover letter, job post, or candidate screening questions.";

export const chatWithJobMate = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please type a question for JobMate.",
        success: false,
      });
    }

    const templateReply = getTemplateReply(message);
    if (templateReply) {
      return res.status(200).json({
        reply: templateReply,
        source: "template",
        success: true,
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(200).json({
        reply: fallbackReply(message),
        source: "demo",
        success: true,
      });
    }

    const reply =
      (await generateGeminiText({
        prompt: message,
        systemInstruction:
          "You are JobMate, a friendly job portal assistant. Help job seekers with job search, resumes, cover letters and interviews. Help recruiters write job posts and candidate screening questions. Give direct, complete, practical answers. When the user asks for questions, provide a list of actual questions instead of a short summary.",
        temperature: 0.6,
        maxOutputTokens: 500,
      })) || fallbackReply(message);

    return res.status(200).json({
      reply,
      source: "gemini",
      success: true,
    });
  } catch (error) {
    return res.status(200).json({
      reply: fallbackReply(req.body?.message),
      source: "demo",
      success: true,
    });
  }
};
