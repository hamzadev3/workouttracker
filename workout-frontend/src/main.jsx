import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./AuthContext";
import { Toaster } from "react-hot-toast";

/**
 * App bootstrap.
 * Wrap with AuthProvider and global toast container.
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster position="top-center" />
    </AuthProvider>
  </StrictMode>
);
