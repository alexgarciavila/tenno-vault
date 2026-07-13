import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpia el DOM renderizado entre tests para que las aserciones de un test no
// vean nodos dejados por el anterior (Testing Library no lo hace solo sin este
// gancho al no usar el runner con auto-cleanup).
afterEach(() => {
  cleanup();
});
