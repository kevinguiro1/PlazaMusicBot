// utils/logger.js - Sistema de Logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Logger con colores
 */
export function log(mensaje, nivel = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  let prefijo = 'INFO';

  switch (nivel) {
    case 'error':
      color = colors.red;
      prefijo = 'ERROR';
      break;
    case 'warn':
      color = colors.yellow;
      prefijo = 'WARN';
      break;
    case 'success':
      color = colors.green;
      prefijo = 'SUCCESS';
      break;
    case 'debug':
      color = colors.cyan;
      prefijo = 'DEBUG';
      break;
    case 'info':
    default:
      color = colors.blue;
      prefijo = 'INFO';
      break;
  }

  console.log(
    `${colors.bright}[${timestamp}]${colors.reset} ` +
    `${color}[${prefijo}]${colors.reset} ${mensaje}`
  );
}
