import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { verifySupabaseConnection } from "./integrations/supabase/healthcheck";

// Verifica a conexão do Supabase uma vez na inicialização (log apenas)
verifySupabaseConnection().then((res) => {
  const prefix = "[Supabase]";
  if (res.ok) {
    console.info(prefix, res.message);
  } else {
    console.error(prefix, res.message);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
