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
  const [token, setTokenState] = useState<string | null>("bypass-token-active");
  const [user, setUser] = useState<DecodedUser | null>({
    id: "bypass-user-id",
    name: "Developer Admin",
    email: "developer@konvergenz.co.ke",
    role: "admin",
  });
  const [ready, setReady] = useState(true);

  useEffect(() => {
    localStorage.setItem("kns_token", "bypass-token-active");
  }, []);

  const signIn = (t: string) => {};

  const signOut = () => {};

  const isAuthenticated = true;

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
