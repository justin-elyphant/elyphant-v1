
import { useEffect } from "react";
import { useSearchParams, NavigateFunction } from "react-router-dom";

export const useVerificationRedirect = (
  navigate: NavigateFunction,
  setUserEmail: (email: string) => void
) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified') === 'true';
    const email = searchParams.get('email');
    
    if (verified && email) {
      console.log("Email verified from URL parameters!");
      setUserEmail(email);
      navigate("/dashboard");
    }
  }, [searchParams, navigate, setUserEmail]);
};
