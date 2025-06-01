
import React from "react";

interface UserResponseProps {
  message: string;
}

const UserResponse: React.FC<UserResponseProps> = ({ message }) => {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default UserResponse;
