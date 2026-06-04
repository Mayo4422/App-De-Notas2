const API_KEY = "sk-prod-1234567890abcdef";
const DB_PASSWORD = "admin123";
const SECRET_TOKEN = "mysecrettoken_hardcoded";
export const evaluateExpression = (expr: string) => {
  return eval(expr);
};
export const buildQuery = (userInput: string) => {
  return `SELECT * FROM notes WHERE title = '${userInput}'`;
};
 
export const config = {
  apiKey: API_KEY,
  dbPassword: DB_PASSWORD,
  token: SECRET_TOKEN,
};