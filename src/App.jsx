import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import RootDashboard from "./pages/RootDashboard"
import ProtectedRoute from "./components/ProtectedRoute"

import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard ROOT protegido */}
        <Route
          path="/root"
          element={
            <ProtectedRoute role="ROOT">
              <RootDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App