import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import App from "./App.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import MyScores from "./pages/MyScores.tsx";
import AddNewScore from "./pages/AddNewScore.tsx";
import ViewEditScore from "./pages/ViewEditScore.tsx";
import MyCollaborators from "./pages/MyCollaborators.tsx";
import AddNewCollaborator from "./pages/AddNewCollaborator.tsx";
import AllScores from "./pages/AllScores.tsx";
import PrivateLayout from "./components/PrivateLayout.tsx";
import "./styles/shared.css";
import EditCollaborator from "./pages/EditCollaborator.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-scores" element={<MyScores />} />
            <Route path="/add-new-score" element={<AddNewScore />} />
            <Route path="/scores/:scoreId" element={<ViewEditScore />} />
            <Route path="/all-scores" element={<AllScores />} />
            <Route path="/my-collaborators" element={<MyCollaborators />} />
            <Route path="/add-collaborator" element={<AddNewCollaborator />} />
            <Route
              path="/collaborators/:collaboratorId"
              element={<EditCollaborator />}
            />
          </Route>
          {/* Optional: 404 fallback */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
