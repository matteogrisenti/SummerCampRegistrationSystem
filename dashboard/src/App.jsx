import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home/Home"
import NewCamp from "./pages/newCamp/newCamp"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/NewCamp" element={<NewCamp />} />
    </Routes>
  );
}
