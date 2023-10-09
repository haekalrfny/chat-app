import React from "react";
import { HiOutlineUser } from "react-icons/hi2";

const Avatar = ({ userId, online }) => {
  return (
    <div
      className={`w-8 h-8 relative rounded-full flex items-center justify-center bg-[#2d2d2d] border border-[#2d2d2d]`}
    >
      <div className="text-[#1e1e1e]">
        <HiOutlineUser className="text-[#A4BE7B] text-xl" />
      </div>
      {online && (
        <div className="absolute w-2.5 h-2.5 bg-green-500 -bottom-0 -right-0 rounded-full border border-[#1e1e1e]"></div>
      )}
      {!online && (
        <div className="absolute w-2.5 h-2.5 bg-gray-500 -bottom-0 -right-0 rounded-full border border-[#1e1e1e]"></div>
      )}
    </div>
  );
};

export default Avatar;
