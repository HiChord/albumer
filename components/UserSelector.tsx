"use client";

import { useState } from "react";

const USERS = ["Dev", "Khal", "Andy"];

interface UserSelectorProps {
  onUserSelect: (user: string) => void;
  currentUser?: string;
}

export default function UserSelector({ onUserSelect, currentUser }: UserSelectorProps) {
  const [selectedUser, setSelectedUser] = useState(currentUser || USERS[0]);

  const handleSelect = (user: string) => {
    setSelectedUser(user);
    onUserSelect(user);
  };

  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs opacity-40 uppercase tracking-wider">User:</span>
      <div className="flex gap-1">
        {USERS.map((user) => (
          <button
            key={user}
            onClick={() => handleSelect(user)}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              selectedUser === user
                ? "bg-white/10 opacity-100"
                : "opacity-40 hover:opacity-70"
            }`}
          >
            {user}
          </button>
        ))}
      </div>
    </div>
  );
}
