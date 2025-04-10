
import React from "react";

export const HowItWorksSection = () => {
  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-purple-700">1</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Apply to Join</h3>
          <p className="text-gray-600">
            Fill out the form below and our team will review your application
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-purple-700">2</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Integrate Your Products</h3>
          <p className="text-gray-600">
            Connect your inventory through our easy integration options
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-purple-700">3</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Start Selling</h3>
          <p className="text-gray-600">
            We handle marketing, payments, and customer service while you focus on fulfilment
          </p>
        </div>
      </div>
    </div>
  );
};
