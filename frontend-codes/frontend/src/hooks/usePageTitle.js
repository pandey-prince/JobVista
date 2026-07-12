import { useEffect } from "react";
import { DEFAULT_PAGE_TITLE, SITE_NAME } from "@/utils/brand";

export { DEFAULT_PAGE_TITLE };

const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_PAGE_TITLE;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
