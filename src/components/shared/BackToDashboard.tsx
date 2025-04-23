
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackToDashboard = () => {
  return (
    <div className="mb-6">
      <Button variant="ghost" asChild className="p-0">
        <Link to="/dashboard" className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default BackToDashboard;
