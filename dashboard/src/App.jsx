import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home/Home"
import NewCamp from "./pages/newCamp/newCamp"
import Camp from "./pages/Camp/Camp"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/NewCamp" element={<NewCamp />} />
      <Route path="/camps/:slug" element={<Camp />} />
    </Routes>
  );
}
