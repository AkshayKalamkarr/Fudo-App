import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.tsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.tsx";

export const authService = "https://fudo-auth.onrender.com";
export const restaurentService = "https://restaurant-service-umfa.onrender.com";
export const utilsService = "https://utils-service-709u.onrender.com";
export const realtimeService = "https://realtime-service-3nck.onrender.com";
export const riderService = "https://rider-service-tyuf.onrender.com";
export const adminService = "https://admin-service-z431.onrender.com";

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
