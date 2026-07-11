export const EXPERIENCE_LEVELS = [
  "Fresher",
  "0-1 year",
  "1-3 years",
  "3-5 years",
  "5+ years",
  "Internship",
];

export const PROFILE_STEPS = [
  { id: "basics", title: "Basics", hint: "How employers reach you" },
  { id: "education", title: "Education", hint: "Used for match score & alerts" },
  { id: "skills", title: "Skills & goals", hint: "Used for match score & alerts" },
  { id: "experience", title: "Experience", hint: "Work history & internships" },
  { id: "projects", title: "Projects & links", hint: "Showcase your best work" },
];

export const validatePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "").replace(/^91/, "");
  if (!digits) return "Phone number is required";
  if (digits.length !== 10) return "Enter a valid 10-digit phone number";
  return "";
};

export const validateCgpa = (cgpa) => {
  if (!cgpa || String(cgpa).trim() === "") return "";
  const num = parseFloat(cgpa);
  if (Number.isNaN(num) || num < 0 || num > 10) return "CGPA must be between 0 and 10";
  return "";
};

export const validateGraduationYear = (year) => {
  if (!year || String(year).trim() === "") return "";
  const num = parseInt(year, 10);
  const current = new Date().getFullYear();
  if (Number.isNaN(num) || num < 1990 || num > current + 6) {
    return `Enter a valid year (${1990}–${current + 6})`;
  }
  return "";
};

export const validateUrl = (url, { required = false } = {}) => {
  const trimmed = String(url || "").trim();
  if (!trimmed) return required ? "URL is required" : "";
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(parsed.protocol)) return "Enter a valid URL";
    return "";
  } catch {
    return "Enter a valid URL";
  }
};

const hasWorkContent = (item) =>
  Boolean(item?.title?.trim() || item?.company?.trim() || item?.duration?.trim() || item?.description?.trim());

const hasProjectContent = (item) =>
  Boolean(item?.title?.trim() || item?.link?.trim() || item?.description?.trim());

const validateWorkItems = (items = [], prefix) => {
  const errors = {};
  items.forEach((item, index) => {
    if (hasWorkContent(item) && !item.title?.trim()) {
      errors[`${prefix}.${index}.title`] = "Title is required when other fields are filled";
    }
  });
  return errors;
};

const validateProjectItems = (items = []) => {
  const errors = {};
  items.forEach((item, index) => {
    if (!hasProjectContent(item)) return;
    if (!item.title?.trim()) {
      errors[`projects.${index}.title`] = "Project name is required";
    }
    const linkError = validateUrl(item.link);
    if (linkError) errors[`projects.${index}.link`] = linkError;
  });
  return errors;
};

export const validateProfileStep = (stepId, input) => {
  const errors = {};

  if (stepId === "basics") {
    if (!input.fullname?.trim()) errors.fullname = "Full name is required";
    const phoneError = validatePhone(input.phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;
  }

  if (stepId === "education") {
    const cgpaError = validateCgpa(input.cgpa);
    if (cgpaError) errors.cgpa = cgpaError;
    const yearError = validateGraduationYear(input.graduationYear);
    if (yearError) errors.graduationYear = yearError;
  }

  if (stepId === "skills") {
    // Skills and goals are encouraged but optional — users can skip setup entirely.
  }

  if (stepId === "experience") {
    Object.assign(errors, validateWorkItems(input.experience, "experience"));
    Object.assign(errors, validateWorkItems(input.internships, "internships"));
  }

  if (stepId === "projects") {
    const portfolioError = validateUrl(input.portfolio);
    if (portfolioError) errors.portfolio = portfolioError;
    const linkedinError = validateUrl(input.linkedin);
    if (linkedinError) errors.linkedin = linkedinError;
    const githubError = validateUrl(input.github);
    if (githubError) errors.github = githubError;
    Object.assign(errors, validateProjectItems(input.projects));
  }

  return errors;
};

export const isProfileIncomplete = (user) => {
  const profile = user?.profile;
  if (!profile) return true;
  if (profile.profileCompletionSkipped) return true;
  if (!profile.profileCompletedAt) return true;
  return false;
};
