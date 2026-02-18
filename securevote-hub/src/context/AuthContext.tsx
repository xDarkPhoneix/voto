import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { loginAPI, registerAPI, logoutAPI } from "@/services/auth.service";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "voter";
  walletAddress: string;
  aadhaarId: string;
  isApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  aadhaarId: string;
  role: "admin" | "voter";
  walletAddress: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("bv_token")
  );
  const [isLoading, setIsLoading] = useState(true);

  // Auto restore session
  useEffect(() => {
    const savedUser = localStorage.getItem("bv_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // ✅ LOGIN (API Based)
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginAPI(email, password);

      const { user, accessToken } = response.data.data;

      setUser(user);
      setToken(accessToken);

      localStorage.setItem("bv_token", accessToken);
      localStorage.setItem("bv_user", JSON.stringify(user));
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ REGISTER (API Based)
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await registerAPI(data);

      const { user, accessToken } = response.data.data;

      setUser(user);
      setToken(accessToken);

      localStorage.setItem("bv_token", accessToken);
      localStorage.setItem("bv_user", JSON.stringify(user));
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.warn("Logout API failed");
    }

    setUser(null);
    setToken(null);

    localStorage.removeItem("bv_token");
    localStorage.removeItem("bv_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
