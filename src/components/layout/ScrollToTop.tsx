import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    // Use smooth scroll for small jumps, instant for large ones
    window.scrollTo({ top: 0, left: 0, behavior: scrollY < 800 ? "smooth" : "auto" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
