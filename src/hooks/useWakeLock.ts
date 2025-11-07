import { useEffect } from "react";
import { useRef } from "react";

const useWakeLock = (status = true) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  /** Acquire WakeLock */
  useEffect(() => {
    if (!status) return;

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current?.release();
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch (e) {
        console.warn("WakeLock Error");
        console.error(e);
      }
    };

    const handleVisibilityChange = async () => {
      if (
        wakeLockRef.current !== null &&
        document.visibilityState === "visible"
      ) {
        await requestWakeLock();
      }
    };

    /** Watch Visibility Change */
    document.addEventListener("visibilitychange", handleVisibilityChange);

    /** Request initial WakeLock */
    requestWakeLock();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [status]);
};

export { useWakeLock };
