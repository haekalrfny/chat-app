import React, { useContext, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";
import Cookies from "js-cookie";
import {
  HiOutlineBars3,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
} from "react-icons/hi2";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const { username, id, setId, setUsername, sidebarOpen, setSidebarOpen } =
    useContext(UserContext);
  const divUnderMessages = useRef();

  const [logoutModal, setLogoutModal] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 768);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOnlinePeople, setFilteredOnlinePeople] = useState({});
  const [filteredOfflinePeople, setFilteredOfflinePeople] = useState({});

  useEffect(() => {
    connectToWs();
  }, [selectedUserId]);

  const connectToWs = () => {
    const ws = new WebSocket("ws://chatkal-api.vercel.app");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected. Trying to reconnect...");
        connectToWs();
      }, 1000);
    });
  };
  

  const showOnlinePeople = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  };

  const handleMessage = (ev) => {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  };

  const logout = () => {
    axios.post("/logout").then(() => {
      Cookies.remove("token");
      setWs(null);
      setId(null);
      setUsername(null);
    });
  };

  const sendMessage = (ev, file = null) => {
    if (ev) ev.preventDefault();
    if (newMessageText && newMessageText.trim() !== "") {
      ws.send(
        JSON.stringify({
          recipient: selectedUserId,
          text: newMessageText,
          file,
        })
      );

      if (file) {
        axios.get(`/messages/${selectedUserId}`).then((res) => {
          setMessages(res.data);
        });
      } else {
        setNewMessageText("");
        setMessages((prev) => [
          ...prev,
          {
            text: newMessageText,
            sender: id,
            recipient: selectedUserId,
            _id: Date.now(),
          },
        ]);
      }
    } else if (file) {
      ws.send(
        JSON.stringify({
          recipient: selectedUserId,
          text: newMessageText,
          file,
        })
      );

      axios.get(`/messages/${selectedUserId}`).then((res) => {
        setMessages(res.data);
      });
    } else {
      console.error("Tidak ada pesan.");
    }
  };

  const sendFile = (ev) => {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  };

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get(`/messages/${selectedUserId}`).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isLargeScreen) {
      setSidebarOpen(false);
    }
  }, [isLargeScreen]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, "_id");

  // Fungsi ini akan memfilter daftar kontak online berdasarkan pencarian
  const filterOnlineContacts = () => {
    const filteredOnline = {};
    Object.keys(onlinePeopleExclOurUser).forEach((userId) => {
      const username = onlinePeopleExclOurUser[userId].toLowerCase();
      if (username.includes(searchTerm.toLowerCase())) {
        filteredOnline[userId] = onlinePeopleExclOurUser[userId];
      }
    });
    setFilteredOnlinePeople(filteredOnline);
  };

  // Fungsi ini akan memfilter daftar kontak offline berdasarkan pencarian
  const filterOfflineContacts = () => {
    const filteredOffline = {};
    Object.keys(offlinePeople).forEach((userId) => {
      const username = offlinePeople[userId].username.toLowerCase();
      if (username.includes(searchTerm.toLowerCase())) {
        filteredOffline[userId] = offlinePeople[userId];
      }
    });
    setFilteredOfflinePeople(filteredOffline);
  };

  const selectUserId = (userId) => {
    setSelectedUserId(userId);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <div className="flex h-screen bg-[#0F0F0F]">
        <div
          id="sidebar"
          className={`${
            sidebarOpen ? "absolute flex w-5/6 h-full z-10" : "hidden"
          } md:flex w-full md:w-1/3 bg-[#1E1E1E] px-3 md:px-6 flex-col rounded-r-lg overflow-hidden duration-200 glassmorphism-container`}
        >
          <div className="flex-grow">
            <div className="w-min">
              <Logo />
            </div>
            <div className="bg-[#1e1e1e] border border-[#2d2d2d] w-full py-2 px-4 mb-3 rounded-full overflow-hidden flex items-center">
              <div className="w-[95%]">
                <input
                  type="text"
                  className="text-sm w-full h-full bg-transparent outline-none text-white"
                  placeholder="Search Contact..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      filterOnlineContacts();
                      filterOfflineContacts();
                    }
                  }}
                />
              </div>
              <div
                className="w-[5%]"
                onClick={() => {
                  filterOnlineContacts();
                  filterOfflineContacts();
                }}
              >
                <HiOutlineMagnifyingGlass
                  className="text-xl text-[#a4be7b] cursor-pointer"
                  title="Search"
                />
              </div>
            </div>
            {searchTerm !== ""
              ? Object.keys(filteredOnlinePeople).map((userId) => (
                  <Contact
                    key={userId}
                    id={userId}
                    online={true}
                    username={filteredOnlinePeople[userId]}
                    onClick={() => selectUserId(userId)}
                    selected={userId === selectedUserId}
                  />
                ))
              : Object.keys(onlinePeopleExclOurUser).map((userId) => (
                  <Contact
                    key={userId}
                    id={userId}
                    online={true}
                    username={onlinePeopleExclOurUser[userId]}
                    onClick={() => selectUserId(userId)}
                    selected={userId === selectedUserId}
                  />
                ))}

            {searchTerm === ""
              ? Object.keys(offlinePeople).map((userId) => (
                  <Contact
                    key={userId}
                    id={userId}
                    online={false}
                    username={offlinePeople[userId].username}
                    onClick={() => selectUserId(userId)}
                    selected={userId === selectedUserId}
                  />
                ))
              : Object.keys(filteredOfflinePeople).map((userId) => (
                  <Contact
                    key={userId}
                    id={userId}
                    online={false}
                    username={filteredOfflinePeople[userId].username}
                    onClick={() => selectUserId(userId)}
                    selected={userId === selectedUserId}
                  />
                ))}
          </div>
          <div className="w-full flex justify-between items-center p-6 ">
            <span className="mr-2 text-sm text-[#A4BE7B]">
              Hello, {username}!
            </span>
            <button
              title="Logout"
              onClick={() => setLogoutModal(true)}
              className="text-sm font-medium py-2 px-3 rounded-full border border-[#a4be7b] text-white bg-[#a4be7b] hover:bg-transparent hover:border-[#A4BE7B] hover:text-[#a4be7b]"
            >
              Logout
            </button>
          </div>
        </div>
        <div
          id="main"
          className={`${
            sidebarOpen ? "w-full opacity-25" : ""
          } w-full md:w-2/3 flex flex-col`}
        >
          <div id="hamburger" className="block md:hidden p-2">
            <HiOutlineBars3
              title="Open sidebar"
              onClick={() => {
                toggleSidebar();
              }}
              className={` text-[#a4be7b] text-5xl cursor-pointer`}
            />
          </div>
          <div
            onClick={() => setSidebarOpen(false)}
            className={`flex-grow px-3 pt-2`}
          >
            {!selectedUserId && (
              <div className="flex flex-col flex-grow h-full items-center justify-center">
                <h1 className="text-2xl font-bold text-[#a4be7b] mb-1">
                  ChatKal.
                </h1>
                <div className="text-gray-400 flex items-center text-sm gap-2 ">
                  1x chat bayar seribu
                </div>
              </div>
            )}
            {selectedUserId &&
              (messages.length === 0 ? (
                <div className="flex flex-grow h-full items-center justify-center">
                  <div className="text-gray-400 flex items-center text-sm gap-2">
                    Lets start chatting with them!
                    <span>
                      <HiOutlineChatBubbleOvalLeftEllipsis />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative h-full">
                  <div className="overflow-y-auto absolute top-0 left-0 right-0 bottom-2">
                    {messagesWithoutDupes.map((message) => (
                      <div
                        key={message._id}
                        className={
                          message.sender === id ? "text-right" : "text-left"
                        }
                      >
                        <div
                          className={`text-left inline-block px-3 py-2 my-1 rounded-2xl text-sm ${
                            message.sender === id
                              ? "bg-gradient-to-r from-[#a4be7b] to-[#86a971] text-white"
                              : "bg-gradient-to-r from-[#1e1e1e] to-[#333333] text-white"
                          }`}
                        >
                          {message.text}
                          {message.file && (
                            <div>
                              <a
                                target="_blank"
                                className=" flex items-center hover:underline"
                                href={
                                  axios.defaults.baseURL +
                                  "/uploads/" +
                                  message.file
                                }
                              >
                                <HiOutlinePaperClip className="text-md" />
                                {message.file}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={divUnderMessages}></div>
                  </div>
                </div>
              ))}
          </div>
          {!!selectedUserId && (
            <form
              onClick={() => setSidebarOpen(false)}
              className="flex gap-2 px-3 pb-2"
              onSubmit={sendMessage}
            >
              <input
                title="Type message"
                value={newMessageText}
                onChange={(ev) => setNewMessageText(ev.target.value)}
                type="text"
                placeholder="type your message here..."
                className="bg-[#1e1e1e] flex-grow text-sm text-white rounded-full py-2 px-4"
              />
              <label
                title="Send file"
                className="bg-white p-3 text-[#0f0f0f] rounded-full text-lg cursor-pointer border border-white hover:bg-transparent  hover:text-white"
              >
                <input type="file" className="hidden" onChange={sendFile} />
                <HiOutlinePaperClip />
              </label>

              <button
                title="Send message"
                type="submit"
                className="bg-[#a4be7b] p-3 flex items-center justify-center text-white text-lg rounded-full border border-[#a4be7b] hover:bg-transparent hover:text-[#a4be7b]"
              >
                <HiOutlinePaperAirplane />
              </button>
            </form>
          )}
        </div>
      </div>
      {logoutModal ? (
        <div className="fixed inset-0 z-10 w-full h-screen bg-white bg-opacity-30 flex items-center justify-center">
          <div className="bg-[#2d2d2d] p-8 flex flex-col items-center justify-center  rounded-xl text-white w-2/3 md:w-1/4">
            <div className="flex w-full flex-col gap-3">
              <span className="text-center">
                Are you sure want to logout from{" "}
                <span
                  onClick={() => setLogoutModal(false)}
                  className="text-[#a4be7b] cursor-pointer hover:underline  "
                >
                  ChatKal.
                </span>
                ?
              </span>
              <div className="flex flex-col gap-2">
                <div
                  onClick={() => setLogoutModal(false)}
                  className="text-sm text-[#a4be7b] border border-[#a4be7b] px-3 py-2 rounded-full text-center cursor-pointer hover:bg-[#464646]"
                >
                  Cancel
                </div>
                <div
                  onClick={logout}
                  className="text-sm text-white border border-[#a4be7b] bg-[#a4be7b] px-3 py-2 rounded-full text-center hover:bg-transparent hover:text-[#a4be7b] cursor-pointer"
                >
                  Logout
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Chat;
