"use client";

import React, { createContext, useContext, useState, useEffect, use } from "react";

type UserContextType = {
  username: string | null;
  setUsername: (name: string | null) => void;
  user: any;
  setUser: (user: any) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("userData");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUsername(parsed.userID);
      setUser(parsed);
    }
  }, [username]);

  const value: UserContextType = {
    username,
    setUsername: (name) => {
      setUsername(name);
      const stored = sessionStorage.getItem("userData");
      if (stored) {
        const userObj = JSON.parse(stored);
        userObj.userID = name;
        sessionStorage.setItem("userData", JSON.stringify(userObj));
      }
    },
    user,
    setUser
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
