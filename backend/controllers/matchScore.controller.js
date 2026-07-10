import { User } from "../models/user.model.js";
import { MatchScoreCache } from "../models/matchScoreCache.model.js";
import { resolveJobByKey } from "../services/jobResolver.service.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeSkills = (skills = []) =>
  skills.map((skill) => String(skill).toLowerCase().trim()).filter(Boolean);

const computeRuleBasedScore = (user, job) => {
  const profileSkills = normalizeSkills(user?.profile?.skills || []);
  const preferredRoles = normalizeSkills(user?.profile?.preferredJobRoles || []);
  const jobText = [
    job.title,
    job.description,
    ...(job.requirements || []),
  ]
    .join(" ")
    .toLowerCase();

  if (!profileSkills.length && !preferredRoles.length) {
    return {
      score: 0,
      strengths: [],
      gaps: ["Add skills and preferred roles to your profile for a match score"],
      tip: "Complete your profile to unlock personalized match insights.",
      source: "rules",
    };
  }

  const matchedSkills = profileSkills.filter((skill) => jobText.includes(skill));
  const matchedRoles = preferredRoles.filter((role) => jobText.includes(role));
  const strengths = [...new Set([...matchedSkills, ...matchedRoles])].slice(0, 5);
  const gaps = profileSkills
    .filter((skill) => !jobText.includes(skill))
    .slice(0, 4);

  const skillScore = profileSkills.length
    ? Math.round((matchedSkills.length / profileSkills.length) * 70)
    : 0;
  const roleScore = preferredRoles.length
    ? Math.round((matchedRoles.length / preferredRoles.length) * 30)
    : 0;
  const score = Math.min(100, Math.max(10, skillScore + roleScore));

  return {
    score,
    strengths: strengths.length ? strengths : ["Profile overlaps with this role"],
    gaps: gaps.length ? gaps : ["Consider tailoring your resume for this job description"],
    tip: score >= 70
      ? "Strong match — highlight your overlapping skills in your application."
      : "Focus your resume on the skills mentioned in this job description.",
    source: "rules",
  };
};

const fetchJobForMatch = async (jobKey) => resolveJobByKey(jobKey);

import { generateGeminiJson } from "../services/gemini.service.js";

const callGeminiMatchScore = async (user, job) => {
  const profileSummary = {
    skills: user.profile?.skills || [],
    preferredJobRoles: user.profile?.preferredJobRoles || [],
    experience: user.profile?.experience || [],
    education: {
      college: user.profile?.college,
      degree: user.profile?.degree,
      branch: user.profile?.branch,
      graduationYear: user.profile?.graduationYear,
    },
  };

  const prompt = `You are a career matching assistant. Return ONLY valid JSON with keys: score (0-100 integer), strengths (string array max 4), gaps (string array max 4), tip (one short sentence).

Candidate profile:
${JSON.stringify(profileSummary)}

Job:
Title: ${job.title}
Company: ${job.company?.name || job.companyName || ""}
Description: ${(job.description || "").slice(0, 2500)}
Requirements: ${(job.requirements || []).join(", ")}

Score how well this candidate matches the job for an early-career IT role in India.`;

  const parsed = await generateGeminiJson({
    prompt,
    temperature: 0.3,
    maxOutputTokens: 400,
  });

  if (!parsed) return null;

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 4) : [],
    tip: parsed.tip || "Tailor your resume to the job description.",
    source: "gemini",
  };
};

export const getMatchScore = async (req, res) => {
  try {
    const jobKey = req.body.jobKey || req.params.jobKey;
    if (!jobKey) {
      return res.status(400).json({ success: false, message: "jobKey is required" });
    }

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const cached = await MatchScoreCache.findOne({
      user: req.id,
      jobKey: String(jobKey),
      expiresAt: { $gt: new Date() },
    });
    if (cached) {
      return res.status(200).json({
        success: true,
        match: {
          score: cached.score,
          strengths: cached.strengths,
          gaps: cached.gaps,
          tip: cached.tip,
          source: cached.source,
          cached: true,
        },
      });
    }

    const job = await fetchJobForMatch(String(jobKey));
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    let match = await callGeminiMatchScore(user, job);
    if (!match) {
      match = computeRuleBasedScore(user, job);
    }

    await MatchScoreCache.findOneAndUpdate(
      { user: req.id, jobKey: String(jobKey) },
      {
        user: req.id,
        jobKey: String(jobKey),
        score: match.score,
        strengths: match.strengths,
        gaps: match.gaps,
        tip: match.tip,
        source: match.source,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      success: true,
      match: { ...match, cached: false },
    });
  } catch (error) {
    console.error("[MatchScore] failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to calculate match score",
    });
  }
};
