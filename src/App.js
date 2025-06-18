import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { AddMovie } from "./pages/AddMovie";
import WatchPage from "./pages/WatchPage";
import VideoConverter from "./pages/VideoConverter";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import { Auth, AuthProvider, ProtectedRoute, AdminRoute } from "./auth";
import "./styles/styles.css";

function App() {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route
              path="/browse"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/series"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movies"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mylist"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch/:id"
              element={
                <ProtectedRoute>
                  <WatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/convert-videos"
              element={
                <AdminRoute>
                  <VideoConverter />
                </AdminRoute>
              }
            />
            <Route
              path="/add-movie"
              element={
                <AdminRoute>
                  <AddMovie />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WatchlistProvider>
    </AuthProvider>
  );
}

export default App;
