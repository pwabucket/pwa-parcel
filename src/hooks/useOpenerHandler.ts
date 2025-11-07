import { useEffect } from "react";

/* Hook to handle messages from opener window */
const useOpenerHandler = (callback: (event: MessageEvent) => void) => {
  useEffect(() => {
    const hasOpener = window.opener && window.opener !== window;
    const hasParent = window.parent && window.parent !== window;

    /* If no opener or parent, do nothing */
    if (!hasOpener && !hasParent) {
      return;
    }

    /* Message handler */
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.origin) return;
      callback(event);
    };

    /* Listen for messages from opener or parent */
    window.addEventListener("message", handleMessage);

    /* Notify opener or parent that the window is ready */
    if (hasOpener) {
      window.opener.postMessage("ready", "*");
    } else {
      window.parent.postMessage("ready", "*");
    }

    /* Cleanup on unmount */
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [callback]);
};

export { useOpenerHandler };
