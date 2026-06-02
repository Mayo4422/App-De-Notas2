// ⚠️ ARCHIVO DE DEMO — Muestra vulnerabilidad intencional
// Este archivo será detectado por SAST y secrets scan
// NUNCA hacer esto en producción

// ❌ MAL: Credenciales hardcodeadas (vulnerabilidad intencional para el demo)
const API_KEY = "sk-prod-1234567890abcdef";
const DB_PASSWORD = "admin123";
const SECRET_TOKEN = "mysecrettoken_hardcoded";

// ❌ MAL: eval() es una vulnerabilidad de seguridad (OWASP)
export const evaluateExpression = (expr: string) => {
  return eval(expr);
};

// ❌ MAL: Sin sanitización de input — SQL Injection
export const buildQuery = (userInput: string) => {
  return `SELECT * FROM notes WHERE title = '${userInput}'`;
};

export const config = {
  apiKey: API_KEY,
  dbPassword: DB_PASSWORD,
  token: SECRET_TOKEN,
};