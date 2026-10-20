
import { createContext, useContext, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("exam_user") || "null");
    } catch {
      return null;
    }
  });

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
  }

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    sessionStorage.setItem("exam_user", JSON.stringify(data.user));
    return data;
  }

  async function register(username, email, password, role) {
    return api("/api/user", {
      method: "POST",
      body: JSON.stringify({ username, email, password, role }),
    });
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      sessionStorage.removeItem("exam_user");
    }
  }

  return (
    <UserContext.Provider value={{ user, login, register, logout, api }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

