import React from "react";
import { TypeAnimation } from "react-type-animation";

const Title = () => {
  return (
    <div>
      <TypeAnimation
        className="text-[#a4be7b] text-2xl font-bold"
        sequence={["ChatKal.", 1000, "#mangeak", 1000]}
        wrapper="span"
        speed={50}
        repeat={Infinity}
      />
    </div>
  );
};

export default Title;
