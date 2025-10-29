import { Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { Split } from "./pages/Split";

function App() {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path="split" element={<Split />} />
      </Routes>
    </>
  );
}

export default App;
