export const profileInitialState = (user) => ({
  fullname: user?.fullname || "",
  email: user?.email || "",
  phoneNumber: user?.phoneNumber || "",
  bio: user?.profile?.bio || "",
  skills: user?.profile?.skills?.join(", ") || "",
  college: user?.profile?.college || "",
  degree: user?.profile?.degree || "",
  branch: user?.profile?.branch || "",
  graduationYear: user?.profile?.graduationYear || "",
  cgpa: user?.profile?.cgpa || "",
  location: user?.profile?.location || "",
  experience: formatWorkItems(user?.profile?.experience),
  internships: formatWorkItems(user?.profile?.internships),
  projects: formatProjectItems(user?.profile?.projects),
  portfolio: user?.profile?.portfolio || "",
  linkedin: user?.profile?.linkedin || "",
  github: user?.profile?.github || "",
  preferredJobRoles: user?.profile?.preferredJobRoles?.join(", ") || "",
});

export const formatWorkItems = (items = []) =>
  items
    .map((item) =>
      [item.title, item.company, item.duration, item.description].filter(Boolean).join(" | "),
    )
    .join("\n");

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

export const buildProfileFormData = (input, skipped = false) => {
  const formData = new FormData();
  formData.append("fullname", input.fullname);
  formData.append("email", input.email);
  formData.append("phoneNumber", input.phoneNumber);
  formData.append("bio", input.bio);
  formData.append("skills", input.skills);
  formData.append("college", input.college);
  formData.append("degree", input.degree);
  formData.append("branch", input.branch);
  formData.append("graduationYear", input.graduationYear);
  formData.append("cgpa", input.cgpa);
  formData.append("location", input.location);
  formData.append("portfolio", input.portfolio);
  formData.append("linkedin", input.linkedin);
  formData.append("github", input.github);
  formData.append("preferredJobRoles", input.preferredJobRoles);
  formData.append("profileCompletionSkipped", String(skipped));
  formData.append(
    "experience",
    JSON.stringify(parseLines(input.experience, ["title", "company", "duration", "description"])),
  );
  formData.append(
    "internships",
    JSON.stringify(parseLines(input.internships, ["title", "company", "duration", "description"])),
  );
  formData.append("projects", JSON.stringify(parseLines(input.projects, ["title", "link", "description"])));
  return formData;
};
