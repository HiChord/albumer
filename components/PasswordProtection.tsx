"use client";

import { useState, useEffect } from "react";

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem("albumer_auth");
    if (auth === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    try {
      const response = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        localStorage.setItem("albumer_auth", "authenticated");
        setIsAuthenticated(true);
      } else {
        setError(true);
        setPassword("");
      }
    } catch (err) {
      setError(true);
      setPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f5' }}>
        <div className="opacity-60">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f5', color: '#3d3935' }}>
        <div className="w-full max-w-md px-8">
          <div className="text-center mb-8">
            <div className="w-3 h-3 rounded-full mx-auto mb-6 opacity-60" style={{ background: '#d4a574' }}></div>
            <h1 className="text-5xl font-light tracking-tight mb-4" style={{ fontWeight: 200 }}>
              halllo!
            </h1>
            <p className="text-sm opacity-40 uppercase tracking-wider">Password Protected</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password"
                className="w-full px-4 py-3 text-center border-b-2 bg-transparent focus:outline-none transition-colors font-light"
                style={{
                  borderColor: error ? '#c67b5c' : '#d4a574',
                  color: '#3d3935'
                }}
                autoFocus
              />
              {error && (
                <p className="text-xs text-center mt-2 opacity-60" style={{ color: '#c67b5c' }}>
                  Incorrect password
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 text-sm uppercase tracking-wider font-light transition-opacity hover:opacity-80"
              style={{ background: '#d4a574', color: 'white' }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
