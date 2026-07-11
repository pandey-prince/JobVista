export const emptyWorkItem = () => ({
  title: "",
  company: "",
  duration: "",
  description: "",
});

export const emptyProjectItem = () => ({
  title: "",
  link: "",
  description: "",
});

const normalizeWorkItems = (items) => {
  if (Array.isArray(items)) {
    return items
      .map((item) => ({
        title: item?.title?.trim() || "",
        company: item?.company?.trim() || "",
        duration: item?.duration?.trim() || "",
        description: item?.description?.trim() || "",
      }))
      .filter((item) => item.title || item.company || item.duration || item.description);
  }

  return parseLines(items, ["title", "company", "duration", "description"]);
};

const normalizeProjectItems = (items) => {
  if (Array.isArray(items)) {
    return items
      .map((item) => ({
        title: item?.title?.trim() || "",
        link: item?.link?.trim() || "",
        description: item?.description?.trim() || "",
      }))
      .filter((item) => item.title || item.link || item.description);
  }

  return parseLines(items, ["title", "link", "description"]);
};

export const profileInitialState = (user) => ({
  fullname: user?.fullname || "",
  email: user?.email || "",
  phoneNumber: user?.phoneNumber ? String(user.phoneNumber) : "",
  bio: user?.profile?.bio || "",
  skills: user?.profile?.skills?.length ? [...user.profile.skills] : [],
  college: user?.profile?.college || "",
  degree: user?.profile?.degree || "",
  branch: user?.profile?.branch || "",
  graduationYear: user?.profile?.graduationYear || "",
  cgpa: user?.profile?.cgpa || "",
  location: user?.profile?.location || "",
  experienceLevel: "",
  experience: user?.profile?.experience?.length
    ? user.profile.experience.map((item) => ({ ...emptyWorkItem(), ...item }))
    : [],
  internships: user?.profile?.internships?.length
    ? user.profile.internships.map((item) => ({ ...emptyWorkItem(), ...item }))
    : [],
  projects: user?.profile?.projects?.length
    ? user.profile.projects.map((item) => ({ ...emptyProjectItem(), ...item }))
    : [],
  portfolio: user?.profile?.portfolio || "",
  linkedin: user?.profile?.linkedin || "",
  github: user?.profile?.github || "",
  preferredJobRoles: user?.profile?.preferredJobRoles?.length
    ? [...user.profile.preferredJobRoles]
    : [],
});

/** @deprecated Pipe-delimited formatting kept for backward compatibility */
export const formatWorkItems = (items = []) =>
  items
    .map((item) =>
      [item.title, item.company, item.duration, item.description].filter(Boolean).join(" | "),
    )
    .join("\n");

/** @deprecated Pipe-delimited formatting kept for backward compatibility */
export const formatProjectItems = (items = []) =>
  items
    .map((item) => [item.title, item.link, item.description].filter(Boolean).join(" | "))
    .join("\n");

const parseLines = (value, keys) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return keys.reduce((item, key, index) => ({ ...item, [key]: parts[index] || "" }), {});
    });

const toCommaList = (value) => (Array.isArray(value) ? value.join(", ") : String(value || ""));

export const buildProfileFormData = (input, skipped = false) => {
  const formData = new FormData();
  formData.append("fullname", input.fullname);
  formData.append("email", input.email);
  formData.append("phoneNumber", input.phoneNumber);
  formData.append("bio", input.bio);
  formData.append("skills", toCommaList(input.skills));
  formData.append("college", input.college);
  formData.append("degree", input.degree);
  formData.append("branch", input.branch);
  formData.append("graduationYear", input.graduationYear);
  formData.append("cgpa", input.cgpa);
  formData.append("location", input.location);
  formData.append("portfolio", input.portfolio);
  formData.append("linkedin", input.linkedin);
  formData.append("github", input.github);
  formData.append("preferredJobRoles", toCommaList(input.preferredJobRoles));
  formData.append("profileCompletionSkipped", String(skipped));
  formData.append("experience", JSON.stringify(normalizeWorkItems(input.experience)));
  formData.append("internships", JSON.stringify(normalizeWorkItems(input.internships)));
  formData.append("projects", JSON.stringify(normalizeProjectItems(input.projects)));
  return formData;
};
