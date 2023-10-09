import React from "react";
import Avatar from "./Avatar";

const Contact = ({ id, username, onClick, selected, online }) => {
  return (
    <div
      title={username}
      onClick={() => onClick(id)}
      key={id}
      className={`text-white flex rounded-sm items-center gap-1 cursor-pointer hover:bg-[#2d2d2d] ${
        selected ? "bg-[#2d2d2d]" : ""
      }`}
    >
      {selected && <div className="w-1 rounded-r-lg bg-[#A4BE7B] h-14"></div>}
      <div className="flex gap-3 px-6 py-3 items-center">
        <Avatar online={online} userId={id} />
        <span>{username}</span>
      </div>
    </div>
  );
};

export default Contact;
