import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthContextType {
  user: any;
  login: (userData: any, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<any>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(userData: any) {
  return {
    ...userData,
    type_user: Number(userData.type_user),
    is_group_leader: Boolean(userData.is_group_leader),
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (savedUser && token && savedUser !== "undefined") {
          setUser(normalizeUser(JSON.parse(savedUser)));
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = (userData: any, token: string) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
  };

  const updateUser = useCallback((userData: Partial<any>) => {
    setUser((prev: any) => {
      if (!prev) return prev;
      const next = normalizeUser({ ...prev, ...userData });
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/signin";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
