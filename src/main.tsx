import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAdmin } from "./lib/initLocalStorage";

// Initialize admin account
initializeAdmin();

createRoot(document.getElementById("root")!).render(<App />);
