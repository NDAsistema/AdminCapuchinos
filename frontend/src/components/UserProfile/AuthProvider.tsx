import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  id_brotther: number;
  email: string;
  name_brother: string;
  img_brother: string;
  type_user: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean; // Añadimos estado de carga
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  
  // INICIALIZACIÓN SÍNCRONA: Evita el null inicial al recargar
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        return jwtDecode<User>(token);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    // Marcamos que ya terminó la revisión inicial
    setLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode<User>(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};