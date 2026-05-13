import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ModManagerApp } from "@modmanager/ui";

import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Renderer root element was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ModManagerApp />
  </StrictMode>
);
