"use client";

import PasswordProtection from "./PasswordProtection";
import UserSelector from "./UserSelector";
import { UserProvider } from "@/lib/UserContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PasswordProtection>
        <UserSelector />
        {children}
      </PasswordProtection>
    </UserProvider>
  );
}
