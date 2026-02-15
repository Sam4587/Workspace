import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import Accounts from "./pages/Accounts"
import Publish from "./pages/Publish"
import History from "./pages/History"

function App() {
  return (
    <TooltipProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </Router>
    </TooltipProvider>
  )
}

export default App
