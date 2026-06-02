// ✅ VERSIÓN CORREGIDA — Sin credenciales hardcodeadas

// ✅ BIEN: Variables de entorno
const API_KEY = process.env.API_KEY ?? "";
const SECRET_TOKEN = process.env.SECRET_TOKEN ?? "";

// ✅ BIEN: Sin eval()
export const evaluateExpression = (expr: string): number => {
  const sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  return Function(`"use strict"; return (${sanitized})`)() as number;
};

// ✅ BIEN: Parámetros preparados (sin concatenación directa)
export const buildQuery = (
  userInput: string,
): { query: string; params: string[] } => {
  return {
    query: "SELECT * FROM notes WHERE title = ?",
    params: [userInput],
  };
};

export const config = {
  apiKey: API_KEY,
  token: SECRET_TOKEN,
};
