import { useEffect } from "react";

export const DEFAULT_PAGE_TITLE = "JobVista | a platform to get hired";

const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | JobVista` : DEFAULT_PAGE_TITLE;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
