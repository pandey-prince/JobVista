import React, { createContext, useContext, useMemo, useState } from "react";

const JobMateContext = createContext({
  jobContext: null,
  setJobContext: () => {},
});

export const JobMateProvider = ({ children }) => {
  const [jobContext, setJobContext] = useState(null);

  const value = useMemo(
    () => ({
      jobContext,
      setJobContext,
    }),
    [jobContext],
  );

  return <JobMateContext.Provider value={value}>{children}</JobMateContext.Provider>;
};

export const useJobMateContext = () => useContext(JobMateContext);

export default JobMateContext;
