import React from "react";

const Logo = () => {
  const refresh = () => {
    window.location.reload();
  };

  return (
    <div className="p-6">
      <h1
        title="ChatKal."
        onClick={refresh}
        className="cursor-pointer text-3xl font-bold text-[#A4BE7B] "
      >
        ChatKal.
      </h1>
    </div>
  );
};

export default Logo;
