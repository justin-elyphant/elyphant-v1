
import React from "react";

export const TestimonialsSection = () => {
  return (
    <div className="mb-16 bg-purple-50 p-8 rounded-lg">
      <h2 className="font-sans text-2xl md:text-3xl font-semibold text-center mb-8">What Our Partners Say</h2>
      <div className="max-w-3xl mx-auto">
        <blockquote className="italic text-gray-700 text-lg text-center">
          "Since joining Elyphant, we've seen a 30% increase in sales with minimal extra work on our part. Their integration was seamless and the team is incredibly supportive."
          <footer className="text-muted-foreground mt-4 font-medium">
            — Sarah Johnson, Local Boutique Owner
          </footer>
        </blockquote>
      </div>
    </div>
  );
};
