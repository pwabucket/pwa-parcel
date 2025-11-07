import { useEffect } from "react";

/* Hook to handle messages from opener window */
const useOpenerHandler = (callback: (event: MessageEvent) => void) => {
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin === window.origin) return;
        callback(event);
      };

      window.addEventListener("message", handleMessage);
      window.opener.postMessage("ready", "*");

      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [callback]);
};

export { useOpenerHandler };
