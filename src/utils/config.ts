// ✅ VERSIÓN CORREGIDA — Sin credenciales hardcodeadas

const API_KEY = process.env.API_KEY ?? "";
const SECRET_TOKEN = process.env.SECRET_TOKEN ?? "";

export const evaluateExpression = (expr: string): number => {
  const sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  return Function(`"use strict"; return (${sanitized})`)() as number;
};

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
