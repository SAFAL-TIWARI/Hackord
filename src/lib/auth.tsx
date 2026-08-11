import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch, ApiError } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  username: string;
  avatar: string;
  college: string;
  city: string;
  country: string;
  bio: string;
  experience: "Beginner" | "Intermediate" | "Advanced";
  skills: string[];
  github: string;
  linkedin: string;
  portfolio: string;
  completedHackathons: { name: string; result: string }[];
  createdAt: string;
  updatedAt: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<{ isNewUser?: boolean }>;
  githubLogin: (code: string) => Promise<{ isNewUser?: boolean }>;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ isNewUser?: boolean }>;
  signupRequestOtp: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signupVerifyOtp: (name: string, email: string, password: string, otp: string) => Promise<{ isNewUser?: boolean }>;
  forgotPasswordRequest: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPasswordVerify: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Token helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = "hackord_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from token
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
    } catch {
      // Token expired or invalid
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("hackord_user", JSON.stringify(user));
      } else if (!loading) {
        localStorage.removeItem("hackord_user");
      }
    }
  }, [user, loading]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
  };

  const googleLogin = async (credential: string): Promise<{ isNewUser?: boolean }> => {
    const data = await apiFetch<{ token: string; user: AuthUser; isNewUser?: boolean }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
    return { isNewUser: data.isNewUser };
  };

  const githubLogin = async (code: string): Promise<{ isNewUser?: boolean }> => {
    const data = await apiFetch<{ token: string; user: AuthUser; isNewUser?: boolean }>("/auth/github", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
    return { isNewUser: data.isNewUser };
  };

  const requestOtp = async (email: string) => {
    return await apiFetch<{ success: boolean; message: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const verifyOtp = async (email: string, otp: string): Promise<{ isNewUser?: boolean }> => {
    const data = await apiFetch<{ token: string; user: AuthUser; isNewUser?: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
    return { isNewUser: data.isNewUser };
  };

  const signupRequestOtp = async (name: string, email: string, password: string) => {
    return await apiFetch<{ success: boolean; message: string }>("/auth/signup-request-otp", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  };

  const signupVerifyOtp = async (name: string, email: string, password: string, otp: string): Promise<{ isNewUser?: boolean }> => {
    const data = await apiFetch<{ token: string; user: AuthUser; isNewUser?: boolean }>("/auth/signup-verify-otp", {
      method: "POST",
      body: JSON.stringify({ name, email, password, otp }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
    return { isNewUser: data.isNewUser };
  };

  const forgotPasswordRequest = async (email: string) => {
    return await apiFetch<{ success: boolean; message: string }>("/auth/forgot-password-request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const resetPasswordVerify = async (email: string, otp: string, newPassword: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser; success: boolean; message: string }>("/auth/reset-password-verify", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("hackord_user", JSON.stringify(data.user));
    }
    setUser(data.user);
    return { success: data.success, message: data.message };
  };

  const logout = () => {
    removeToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("hackord_user");
    }
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<AuthUser>) => {
    const data = await apiFetch<{ user: AuthUser }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        signup,
        googleLogin,
        githubLogin,
        requestOtp,
        verifyOtp,
        signupRequestOtp,
        signupVerifyOtp,
        forgotPasswordRequest,
        resetPasswordVerify,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
