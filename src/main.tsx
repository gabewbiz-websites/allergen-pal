import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./lib/store";
import { AuthProvider } from "./lib/auth";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StoreProvider>
  </StrictMode>,
);
