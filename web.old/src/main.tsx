import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { PrefsProvider } from "./context/PrefsContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PrefsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PrefsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
