"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = "Dev" | "Khal" | "Andy";

interface UserContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>("Dev");

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("albumer_current_user");
    if (savedUser && (savedUser === "Dev" || savedUser === "Khal" || savedUser === "Andy")) {
      setCurrentUser(savedUser as User);
    }
  }, []);

  // Save user to localStorage when it changes
  const handleSetUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("albumer_current_user", user);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
