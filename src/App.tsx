import { Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { Split } from "./pages/Split";
import { Merge } from "./pages/Merge";
import { useIsMutating } from "@tanstack/react-query";
import { useWakeLock } from "./hooks/useWakeLock";

function App() {
  /* Track Ongoing Mutations */
  const isMutating = useIsMutating();

  /* Enable Wake Lock when Mutating */
  useWakeLock(isMutating > 0);

  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path="split" element={<Split />} />
        <Route path="merge" element={<Merge />} />
      </Routes>
    </>
  );
}

export default App;
