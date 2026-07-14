import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll the window to the top on every pathname/search change.
 * Without this, SPA navigations from the footer keep the previous scroll
 * offset — so destination pages appear stuck at the bottom.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
