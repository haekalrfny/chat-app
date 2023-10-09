import React, { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";
import Title from "./Title";
import {
  AiOutlineGithub,
  AiOutlineInstagram,
  AiFillLinkedin,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";

const RegisterAndLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  // loading
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = isLoginOrRegister === "register" ? "/register" : "/login";
    setLoading(true);

    axios
      .post(`https://chatkal-api.vercel.app/api${url}`, { username, password })
      .then((response) => {
        setLoggedInUsername(username);
        setId(response.data.id);
      })
      .catch((error) => {
        window.alert("Failed!");
        console.error("Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      {loading ? (
        <div className="bg-[#0f0f0f] w-full h-screen flex justify-center items-center">
          <div className="three-body">
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f0f0f] h-screen flex items-center">
          <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
            <div className="text-center mb-3">
              <Title />
            </div>
            <div className="relative">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                placeholder="Username"
                className="block w-full text-sm rounded-full py-2 px-3 mb-2 text-white outline-none bg-[#1e1e1e]"
              />
            </div>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="block w-full text-sm rounded-full py-2 px-3 mb-2 text-white outline-none bg-[#1e1e1e]"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3 cursor-pointer text-gray-400"
              >
                {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
              </span>
            </div>

            <button className="bg-[#A4BE7B] text-sm text-white border border-[#a4be7b] rounded-full py-2 px-3 block w-full hover:bg-transparent hover:text-[#a4be7b]">
              {isLoginOrRegister === "register" ? "Register" : "Login"}
            </button>
            <div className="text-center ml-2 mt-2">
              {isLoginOrRegister === "register" && (
                <div className="flex gap-1 text-sm text-white">
                  Already a member?
                  <button
                    className="text-[#A4BE7B] hover:underline"
                    onClick={() => setIsLoginOrRegister("login")}
                  >
                    Login
                  </button>
                </div>
              )}
              {isLoginOrRegister === "login" && (
                <div className="flex gap-1 text-sm text-white">
                  Dont have an account?
                  <button
                    className="hover:underline text-[#A4BE7B]"
                    onClick={() => setIsLoginOrRegister("register")}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </form>
          <div className="absolute w-full flex flex-col items-center gap-3 text-lg text-white bottom-0 mb-12">
            <p className="text-sm">narsis dulu :</p>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/haekalrfny/" target="_blank">
                <AiOutlineInstagram className="cursor-pointer hover:text-[#a4be7b]" />
              </a>
              <a href="https://www.linkedin.com/in/haekalrfny/" target="_blank">
                <AiFillLinkedin className="cursor-pointer hover:text-[#a4be7b]" />
              </a>
              <a href="https://github.com/haekalrfny" target="_blank">
                <AiOutlineGithub className="cursor-pointer hover:text-[#a4be7b]" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterAndLoginForm;
