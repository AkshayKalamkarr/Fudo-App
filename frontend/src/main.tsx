import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.tsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.tsx";

export const authService = "http://localhost:5000";
export const restaurentService = "http://localhost:5001";
export const utilsService = "http://localhost:5002";
export const realtimeService = "http://localhost:5004";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="643419543149-5vo2m9sg2i9qdcju08m5a4rtl35mtp6k.apps.googleusercontent.com">
      <AppProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
