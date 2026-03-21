const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists to avoid winston warnings
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Console colors for our custom methods (keeping your beautiful palette!)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underscore: '\x1b[4m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// --- WINSTON CORE CONFIGURATION ---

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] [${level.toUpperCase()}]: ${stack || message}`;
});

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    const errorStack = stack ? `\n${colors.red}${stack}${colors.reset}` : '';
    return `${colors.dim}${timestamp}${colors.reset} ${level}: ${message}${errorStack}`;
  })
);

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // 1. Error logs (Daily rotation)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      format: logFormat,
    }),
    // 2. All logs (Daily rotation)
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: logFormat,
    }),
    // 3. Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// --- CUSTOM WRAPPER (Keeping your beautiful aesthetic methods!) ---

const logger = {
  // Winston-powered methods
  info: (msg) => {
    try {
      winstonLogger.info(msg);
    } catch (e) {
      // If winston fails (e.g. EPIPE), fallback to silent or very basic console
    }
  },
  warn: (msg) => {
    try {
      winstonLogger.warn(msg);
    } catch (e) {}
  },
  error: (msg, err) => {
    try {
      if (err instanceof Error) {
        winstonLogger.error(msg, { stack: err.stack });
      } else if (err) {
        winstonLogger.error(`${msg}: ${err}`);
      } else {
        winstonLogger.error(msg);
      }
    } catch (e) {
      // Fail silently to prevent infinite loops during EPIPE
    }
  },
  debug: (msg) => {
    try {
      winstonLogger.debug(msg);
    } catch (e) {}
  },
  success: (msg) => {
    try {
      winstonLogger.info(`${colors.green}✓${colors.reset} ${msg}`);
    } catch (e) {}
  },

  // Your original beautiful aesthetic methods (untouched but using colors!)
  ascii: (text, color = colors.cyan) => console.log(`${color}${text}${colors.reset}`),

  header: (title) => {
    const line = '━'.repeat(60);
    console.log(`\n${colors.cyan}┏${line}┓`);
    console.log(`┃ ${colors.bright}${colors.white}${title.toUpperCase().padEnd(58)} ${colors.cyan}┃`);
    console.log(`┗${line}┛${colors.reset}`);
  },

  section: (title) => {
    console.log(`\n${colors.bright}${colors.cyan}◆ ${colors.white}${title.toUpperCase()}${colors.reset}`);
    console.log(`${colors.cyan}${'━'.repeat(40)}${colors.reset}`);
  },

  item: (label, value, color = colors.white) => {
    console.log(
      `  ${colors.cyan}▹${colors.reset} ${label.padEnd(15)} ${colors.dim}⫸${colors.reset} ${color}${value}${colors.reset}`
    );
  },

  table: (headers, rows) => {
    const colWidths = headers.map((h, i) => {
      return Math.max(h.length, ...rows.map((r) => String(r[i]).length)) + 2;
    });

    const divider = '╇' + colWidths.map((w) => '━'.repeat(w)).join('╇') + '╇';
    const top = '┏' + colWidths.map((w) => '━'.repeat(w)).join('┳') + '┓';
    const bottom = '┗' + colWidths.map((w) => '━'.repeat(w)).join('┻') + '┛';

    console.log(colors.cyan + top + colors.reset);
    console.log(
      colors.cyan +
        '┃' +
        colors.reset +
        headers
          .map((h, i) => `${colors.bright}${colors.white} ${h.padEnd(colWidths[i] - 1)} ${colors.reset}`)
          .join(colors.cyan + '┃' + colors.reset) +
        colors.cyan +
        '┃' +
        colors.reset
    );
    console.log(colors.cyan + divider + colors.reset);

    rows.forEach((row) => {
      console.log(
        colors.cyan +
          '┃' +
          colors.reset +
          row
            .map((cell, i) => ` ${String(cell).padEnd(colWidths[i] - 1)} `)
            .join(colors.cyan + '┃' + colors.reset) +
          colors.cyan +
          '┃' +
          colors.reset
      );
    });

    console.log(colors.cyan + bottom + colors.reset);
  },

  box: (content, color = colors.cyan) => {
    const lines = content.split('\n');
    const width = Math.max(...lines.map((l) => l.length)) + 4;
    const border = '━'.repeat(width);

    console.log(`${color}┏${border}┓${colors.reset}`);
    lines.forEach((line) => {
      console.log(`${color}┃${colors.reset}  ${line.padEnd(width - 2)} ${color}┃${colors.reset}`);
    });
    console.log(`${color}┗${border}┛${colors.reset}`);
  },

  divider: (char = '─', color = colors.dim) => {
    console.log(`${color}${char.repeat(62)}${colors.reset}`);
  },

  blank: () => console.log(''),

  loader: (message) => {
    const timestamp = colors.dim + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + colors.reset;
    process.stdout.write(
      `${timestamp} ${colors.cyan}⌬${colors.reset} ${message.padEnd(30)} `
    );
    return {
      done: () => process.stdout.write(`${colors.green}● COMPLETED${colors.reset}\n`),
      fail: (err) => process.stdout.write(`${colors.red}✖ FAILED (${err})${colors.reset}\n`),
    };
  },
};

module.exports = logger;
