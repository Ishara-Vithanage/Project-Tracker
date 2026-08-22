"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "./userProvider";

type RefreshContextType = {
  refreshKey: number;
  triggerRefresh: () => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const route = usePathname();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual refresh — call triggerRefresh() after any create/update/delete action
  // instead of auto-polling every 3 seconds (which caused unnecessary API calls)
  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Route guarding based on user role
  useEffect(() => {
    // If the userdata is not loaded yet but there is session storage, wait.
    // However, if the session storage doesn't exist AND we are on a main page, redirect.
    if (!user) {
      if (typeof window !== "undefined" && !sessionStorage.getItem("userData") && route.startsWith('/main')) {
         router.push('/login');
      }
      return;
    }

    const role = user.role;

    // Defined restricted routes
    const restrictedRoutes: { [key: string]: string[] } = {
      DEV: ['/main/create-project', '/main/manage-users', '/main/inquiry'],
      MGR: ['/main/manage-users', '/main/inquiry'],
      // HEAD has access to everything
    };

    if (role === 'DEV' && restrictedRoutes.DEV.some(path => route.startsWith(path))) {
      router.push('/main/home');
    } else if (role === 'MGR' && restrictedRoutes.MGR.some(path => route.startsWith(path))) {
      router.push('/main/home');
    }

  }, [user, route, router]);

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within an AppWrapper");
  }
  return context;
};
