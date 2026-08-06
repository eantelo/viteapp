import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { FormPrefillProvider } from "@/contexts/FormPrefillContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { registerDefaultActions } from "@/lib/interface-agent";

// Register default interface agent actions at startup
registerDefaultActions();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <CurrencyProvider>
            <FormPrefillProvider>
              <App />
            </FormPrefillProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
