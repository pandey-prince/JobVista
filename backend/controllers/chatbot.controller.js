import { generateGeminiText, isGeminiConfigured } from "../services/gemini.service.js";

const getTemplateReply = (message = "") => {
  const text = message.toLowerCase();

  if (text.includes("screen") || (text.includes("interview") && text.includes("question"))) {
    return `Here are 10 common interview questions to practice:
1. Tell me about yourself.
2. Why do you want this role?
3. Which projects best show your skills for this job?
4. What is your strongest technical skill and where have you used it?
5. Describe a challenge you solved in a project or internship.
6. How do you learn new tools or technologies?
7. What kind of team environment helps you do your best work?
8. Where do you see yourself in the next 2–3 years?
9. Why should we hire you?
10. What questions do you have for us?

If you want, I can also give role-specific questions for frontend, backend, QA, or data roles.`;
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

  if (text.includes("apply")) {
    return `To apply effectively:
* Read the full job description.
* Match your resume to the role.
* Keep your profile updated.
* Apply with a clean resume and correct links.
* Prepare a short introduction in case the employer calls.

If you want, I can also help you tailor your application.`;
  }

  return null;
};

const fallbackReply = (message = "") =>
  getTemplateReply(message) ||
  "Hi, I am JobMate. I help job seekers with applications, resumes, interviews, and cover letters. Ask me about job search tips, resume formatting, or interview prep.";

export const chatWithJobMate = async (req, res) => {
  try {
    const { message, jobTitle, jobCompany } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please type a question for JobMate.",
        success: false,
      });
    }

    const jobContextLine =
      jobTitle || jobCompany
        ? `The user is viewing a job posting${jobTitle ? ` for "${jobTitle}"` : ""}${
            jobCompany ? ` at ${jobCompany}` : ""
          }.`
        : "";

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
          "You are JobMate, a friendly job portal assistant for job seekers. Help with job search, resume tips, cover letters, and interview preparation. Give direct, complete, practical answers. When the user asks for questions, provide a list of actual questions instead of a short summary." +
          (jobContextLine ? ` ${jobContextLine} Tailor answers to this specific role when relevant.` : ""),
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
