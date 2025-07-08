import { useMediaQuery } from "@/hooks/useMediaQuery";

export const useIsMobile = () => {
  return useMediaQuery('(max-width: 768px)');
};