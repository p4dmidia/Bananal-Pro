import React, { useEffect } from "react";

export default function VSLPage() {
  useEffect(() => {
    // Redireciona de forma transparente para a versão estática da VSL preservando query params (UTMs, etc)
    window.location.replace("/vsl.html" + window.location.search);
  }, []);

  return (
    <div style={{ backgroundColor: "#00170F", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFE17A" }}>
      <p>Carregando apresentação...</p>
    </div>
  );
}
