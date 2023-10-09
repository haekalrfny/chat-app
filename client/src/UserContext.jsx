import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export const UserContextProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);
  useEffect(() => {
    axios.get("/profile").then((response) => {
      setId(response.data.userId);
      setUsername(response.data.username);
    });
  }, []);
  return (
    <UserContext.Provider
      value={{
        username,
        setUsername,
        id,
        setId,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
