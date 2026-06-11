import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken } from "./api";

// Decoded JWT user structure
export interface DecodedUser {
  id: string;
  name: string;
  email: string;
  role: "employee" | "admin";
}

const ADMIN_USER: DecodedUser = {
  id: "bypass-admin-id",
  name: "Developer Admin",
  email: "developer@konvergenz.co.ke",
  role: "admin",
};

const EMPLOYEE_USER: DecodedUser = {
  id: "bypass-employee-id",
  name: "John Employee",
  email: "employee@konvergenz.co.ke",
  role: "employee",
};

interface AuthCtx {
  user: DecodedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  ready: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
  switchRole: (role: "admin" | "employee") => void;
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
  const [token, setTokenState] = useState<string | null>(() => {
    const existing = localStorage.getItem("kns_token");
    return existing === "bypass-token-employee" ? "bypass-token-employee" : "bypass-token-admin";
  });
  const [user, setUser] = useState<DecodedUser | null>(() => {
    const existing = localStorage.getItem("kns_token");
    return existing === "bypass-token-employee" ? EMPLOYEE_USER : ADMIN_USER;
  });
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("kns_token");
    if (t !== "bypass-token-employee" && t !== "bypass-token-admin") {
      localStorage.setItem("kns_token", "bypass-token-admin");
    }
  }, []);

  const signIn = (t: string) => {};

  const signOut = () => {};

  const switchRole = (role: "admin" | "employee") => {
    const t = role === "admin" ? "bypass-token-admin" : "bypass-token-employee";
    const u = role === "admin" ? ADMIN_USER : EMPLOYEE_USER;
    setTokenState(t);
    setUser(u);
    localStorage.setItem("kns_token", t);
  };

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
        switchRole,
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
