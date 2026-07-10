export const emptyJobFilters = {
  locations: [],
  roles: [],
  jobTypes: [],
  experienceLevels: [],
};

const includesAny = (text, values) => {
  if (!values?.length) return true;
  const lowerText = String(text || "").toLowerCase();
  return values.some((value) => lowerText.includes(value.toLowerCase()));
};

export const filterJobs = (jobs, searchedQuery = "", selectedFilters = emptyJobFilters) => {
  const query = searchedQuery.trim().toLowerCase();

  return jobs.filter((job) => {
    const searchableText = [
      job?.title,
      job?.description,
      job?.location,
      job?.jobType,
      job?.experienceLevel,
      job?.company?.name,
      ...(job?.requirements || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);
    const matchesLocation = includesAny(job?.location, selectedFilters.locations);
    const matchesRole = includesAny(searchableText, selectedFilters.roles);
    const matchesJobType = includesAny(`${job?.jobType} ${job?.location}`, selectedFilters.jobTypes);
    const matchesExperience = includesAny(searchableText, selectedFilters.experienceLevels);

    return matchesSearch && matchesLocation && matchesRole && matchesJobType && matchesExperience;
  });
};
