import { useState, useEffect } from "react";

const DelayedFallback = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 w-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]"
          style={{ width: "40%" }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
};

export default DelayedFallback;
