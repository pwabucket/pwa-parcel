import { Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { Split } from "./pages/Split";
import { Merge } from "./pages/Merge";

function App() {
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
