"use client";

import PasswordProtection from "./PasswordProtection";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PasswordProtection>{children}</PasswordProtection>;
}
