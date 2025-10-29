"use client";

import { useUser } from "@/lib/UserContext";
import { User } from "lucide-react";

export default function UserSelector() {
  const { currentUser, setCurrentUser } = useUser();
  const users = ["Dev", "Khal", "Andy"] as const;

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm"
        style={{
          background: 'rgba(30, 30, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <User className="w-4 h-4 opacity-40" />
        <div className="flex gap-1">
          {users.map((user) => (
            <button
              key={user}
              onClick={() => setCurrentUser(user)}
              className="px-3 py-1 text-xs font-light tracking-wide rounded-full transition-all"
              style={{
                background: currentUser === user ? 'var(--accent)' : 'transparent',
                color: currentUser === user ? 'var(--background)' : 'var(--foreground)',
                opacity: currentUser === user ? 1 : 0.5,
              }}
            >
              {user}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
