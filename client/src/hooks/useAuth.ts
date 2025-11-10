import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
  });

  const loginWithRedirect = () => {
    // Save the current URL to redirect back after login
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('auth_redirect', currentPath);
      window.location.href = '/login';
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshAuth: refetch,
    loginWithRedirect,
  };
}
