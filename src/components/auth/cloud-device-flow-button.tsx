"use client";

import { useEffect, useRef, useState } from "react";

import {
  fetchAuthConfig,
  pollForDeviceToken,
  startDeviceFlow,
} from "@/src/lib/cloud-device-flow";
import { Button } from "@/src/components/ui/button";

interface CloudDeviceFlowButtonProps {
  onToken: (token: string) => void;
}

type Status = "idle" | "starting" | "waiting" | "error";

export function CloudDeviceFlowButton({ onToken }: CloudDeviceFlowButtonProps) {
  const [cloudUrl, setCloudUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAuthConfig()
      .then((config) => {
        if (!cancelled) setCloudUrl(config.openhandsBaseUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load auth config.");
        }
      });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
      popupRef.current?.close();
    };
  }, []);

  const start = async () => {
    if (!cloudUrl) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("starting");
    setError(null);
    setVerificationUrl(null);
    setUserCode(null);
    popupRef.current = window.open("about:blank", "_blank");

    try {
      const authorization = await startDeviceFlow(cloudUrl);
      setVerificationUrl(authorization.verification_uri_complete);
      setUserCode(authorization.user_code);
      setStatus("waiting");
      if (popupRef.current && /^https:\/\//i.test(authorization.verification_uri_complete)) {
        popupRef.current.location.href = authorization.verification_uri_complete;
      }
      const token = await pollForDeviceToken(cloudUrl, authorization.device_code, {
        interval: authorization.interval,
        signal: controller.signal,
      });
      onToken(token);
      popupRef.current?.close();
    } catch (err) {
      if (controller.signal.aborted) return;
      popupRef.current?.close();
      setStatus("error");
      setError(err instanceof Error ? err.message : "OpenHands login failed.");
    }
  };

  const isBusy = status === "starting" || status === "waiting";

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={start} disabled={!cloudUrl || isBusy}>
        {isBusy ? "Waiting for OpenHands authorization..." : "Login with OpenHands Cloud"}
      </Button>

      {status === "waiting" ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm text-[var(--color-text-base)]">
          <p>Complete the authorization in the browser window.</p>
          {userCode ? <p className="mt-2">Code: <span className="font-mono text-white">{userCode}</span></p> : null}
          {verificationUrl ? (
            <a className="mt-3 inline-block text-[var(--color-accent)] underline" href={verificationUrl} target="_blank" rel="noreferrer">
              Open authorization page
            </a>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
