/**
 * Funciones utilitarias comunes para la aplicación.
 */

/**
 * Formatea una fecha a un formato legible.
 * @param date - La fecha en formato ISO o Date.
 * @returns La fecha formateada en formato 'dd de mmmm de yyyy'.
 */
export function formatDate(date: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(date).toLocaleDateString('es-ES', options);
  }
  
  /**
   * Capitaliza la primera letra de una cadena.
   * @param string - La cadena a capitalizar.
   * @returns La cadena con la primera letra en mayúscula.
   */
  export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  /**
   * Convierte un texto en formato "snake_case" a "camelCase".
   * @param text - Texto en snake_case.
   * @returns Texto en camelCase.
   */
  export function snakeToCamel(text: string): string {
    return text.replace(/_./g, (match) => match.charAt(1).toUpperCase());
  }
  
  /**
   * Compara dos fechas.
   * @param date1 - La primera fecha.
   * @param date2 - La segunda fecha.
   * @returns `true` si las fechas son iguales, de lo contrario `false`.
   */
  export function compareDates(date1: string, date2: string): boolean {
    return new Date(date1).toISOString() === new Date(date2).toISOString();
  }
  
  /**
   * Verifica si un valor es un número válido.
   * @param value - El valor a verificar.
   * @returns `true` si el valor es un número, de lo contrario `false`.
   */
  export function isValidNumber(value: any): boolean {
    return !isNaN(value) && value !== null && value !== '';
  }
  