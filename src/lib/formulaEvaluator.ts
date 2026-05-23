import { evaluate } from 'safe-expr-eval';

/**
 * Evalúa de forma segura una expresión matemática.
 * @param expr Expresión a evaluar.
 * @param variables Mapa opcional de variables.
 * @returns El resultado numérico de la evaluación.
 * @throws Error si la expresión es inválida o el resultado no es numérico.
 */
export function evaluateSafeFormula(expr: string, variables?: Record<string | number, number>): number {
  // Whitelist estricta: números, puntos, espacios, operadores matemáticos y paréntesis.
  // También permitimos letras y guiones bajos si se pasan variables, pero el prompt pedía:
  // "Valide que la expresión solo contenga números, operadores y paréntesis"
  // Por lo tanto, si la expresión ya está resuelta con números, usamos esta regex:
  const strictRegex = /^[\d\.\s\+\-\*\/\(\)]+$/;
  
  const hasVars = variables && Object.keys(variables).length > 0;
  const validationRegex = hasVars ? /^[\w\d\.\s\+\-\*\/\(\)]+$/ : strictRegex;

  if (!validationRegex.test(expr)) {
    throw new TypeError('La expresión contiene caracteres no permitidos. Peligro de inyección detectado.');
  }

  try {
    const result = evaluate(expr, variables);
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new TypeError('El resultado de la expresión no es un número finito válido.');
    }
    return result;
  } catch (error: any) {
    throw new TypeError(`Error al evaluar la fórmula: ${error.message}`);
  }
}
