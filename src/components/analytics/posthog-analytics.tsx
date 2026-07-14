"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/src/components/auth/auth-context";
import { fetchJson } from "@/src/lib/fetch-json";
import {
  disableAnalytics,
  groupAnalyticsOrganization,
  identifyAnalyticsUser,
  initializeAnalytics,
  resetAnalytics,
} from "@/src/lib/analytics";

interface RuntimeConfig {
  posthogClientKey?: string | null;
}

export const PostHogAnalytics = () => {
  const { user, isAdmin } = useAuth();
  const [ready, setReady] = useState(false);
  const identifiedUserRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchJson<RuntimeConfig>("/api/auth/config")
      .then((config) => {
        if (active && config.posthogClientKey) {
          setReady(initializeAnalytics(config.posthogClientKey));
        } else if (active) {
          disableAnalytics();
        }
      })
      .catch(() => {
        // Analytics must never prevent the application from loading.
        if (active) {
          disableAnalytics();
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const distinctId = user?.id?.trim();
    if (!distinctId) {
      if (identifiedUserRef.current) {
        resetAnalytics();
        identifiedUserRef.current = null;
      }
      return;
    }

    if (identifiedUserRef.current !== distinctId) {
      identifyAnalyticsUser(distinctId, {
        organization_id: user?.orgId ?? undefined,
        organization_role: user?.role ?? undefined,
        is_admin: isAdmin,
      });
      identifiedUserRef.current = distinctId;
    }

    if (user?.orgId) {
      groupAnalyticsOrganization(user.orgId);
    }
  }, [isAdmin, ready, user]);

  return null;
};
