"use client";

import { useAuth } from "@/context/AuthContext";

export function useRole() {
  const { user } = useAuth();

  const roleName = user?.role?.name;
  const isAdministrator = roleName === "Administrator";
  const isAnalyst = roleName === "Service Desk Analyst";

  const hasRole = (...roles: string[]): boolean => {
    return !!roleName && roles.includes(roleName);
  };

  return {
    roleName,
    isAdministrator,
    isAnalyst,
    hasRole,
  };
}
