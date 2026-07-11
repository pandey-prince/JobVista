export const slugifyCompanyName = (name = "") =>
  String(name)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("");

export const companyJobsPath = (companyName) => {
  const slug = slugifyCompanyName(companyName);
  return slug ? `/companies/${slug}` : "/jobs";
};
