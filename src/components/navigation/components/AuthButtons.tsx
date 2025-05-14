
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AuthButtons = () => {
  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/signin">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link to="/signup">Sign Up</Link>
      </Button>
    </>
  );
};

export default AuthButtons;
