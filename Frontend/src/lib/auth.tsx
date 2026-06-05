import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken } from "./api";

// Decoded JWT user structure
export interface DecodedUser {
  id: string;
  name: string;
  email: string;
  role: "employee" | "admin";
}

interface AuthCtx {
  user: DecodedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  ready: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

// Vanilla base64 JWT payload decoder
function decodeToken(token: string): DecodedUser | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existingToken = getToken();
    if (existingToken) {
      const decoded = decodeToken(existingToken);
      if (decoded) {
        setTokenState(existingToken);
        setUser(decoded);
      } else {
        // Clean corrupt or expired local session tokens
        setToken("");
      }
    }
    setReady(true);
  }, []);

  const signIn = (t: string) => {
    const decoded = decodeToken(t);
    if (decoded) {
      setToken(t);
      setTokenState(t);
      setUser(decoded);
    }
  };

  const signOut = () => {
    setToken("");
    setTokenState(null);
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        ready,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
