import React, { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import "./index.css";

import InstallPWA from "./components/PWA/InstallPWA";
import WhatsAppButton from "./components/Layout/WhatsAppButton";

import { Toaster } from "react-hot-toast";

function App() {
  useEffect(() => {
    document.title = "Banana PRO";
  }, []);

  return (
    <>
      <AppRoutes />
      <WhatsAppButton />
      <InstallPWA />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
          },
        }}
      />
    </>
  );
}

export default App;
