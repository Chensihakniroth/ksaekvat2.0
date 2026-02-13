const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Get current date for log file naming
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Format timestamp for log entries
function getTimestamp() {
    return new Date().toISOString();
}

// Write log to file
function writeLog(level, message, error = null) {
    const timestamp = getTimestamp();
    const logFile = path.join(logsDir, `bot-${getCurrentDate()}.log`);
    
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (error) {
        logEntry += `\nError: ${error.message}`;
        if (error.stack) {
            logEntry += `\nStack: ${error.stack}`;
        }
    }
    
    logEntry += '\n';
    
    // Append to log file
    fs.appendFileSync(logFile, logEntry);
}

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m'
};

// Format timestamp for console
function getConsoleTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

const logger = {
    info: (message) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.cyan}ℹ${colors.reset} ${message}`);
        writeLog('info', message);
    },
    
    warn: (message) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.yellow}⚠${colors.reset} ${message}`);
        writeLog('warn', message);
    },
    
    error: (message, error = null) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.red}✕${colors.reset} ${message}`);
        if (error) {
            console.error(error);
        }
        writeLog('error', message, error);
    },
    
    success: (message) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.green}✓${colors.reset} ${message}`);
        writeLog('success', message);
    },
    
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.magenta}⚙${colors.reset} ${message}`);
            writeLog('debug', message);
        }
    },

    header: (title) => {
        const width = Math.min(60, title.length + 10);
        const line = '═'.repeat(width);
        console.log(`\n${colors.bright}${colors.cyan}╔${line}╗${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}║${colors.reset} ${colors.bright}${title.toUpperCase()}${colors.reset}${' '.repeat(width - title.length - 2)}${colors.bright}${colors.cyan}║${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}╚${line}╝${colors.reset}\n`);
    },

    section: (title) => {
        console.log(`\n${colors.bright}${colors.cyan}┌─ ${title}${colors.reset}`);
    },

    box: (title, content, color = colors.cyan) => {
        const width = Math.max(title.length, content.length) + 4;
        const line = '─'.repeat(width);
        console.log(`${color}┌${line}┐${colors.reset}`);
        console.log(`${color}│${colors.reset} ${colors.bright}${title}${colors.reset}${' '.repeat(width - title.length - 3)}${color}│${colors.reset}`);
        console.log(`${color}├${line}┤${colors.reset}`);
        console.log(`${color}│${colors.reset} ${content}${' '.repeat(width - content.length - 3)}${color}│${colors.reset}`);
        console.log(`${color}└${line}┘${colors.reset}`);
    },

    table: (data, headers) => {
        // Calculate column widths
        const widths = headers.map((h, i) => {
            const maxDataWidth = Math.max(...data.map(row => String(row[i] || '').length));
            return Math.max(h.length, maxDataWidth) + 2;
        });

        // Header
        console.log(`${colors.cyan}┌${widths.map(w => '─'.repeat(w)).join('┬')}┐${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset}${headers.map((h, i) => ` ${colors.bright}${h}${colors.reset}${' '.repeat(widths[i] - h.length - 1)}`).join(`${colors.cyan}│${colors.reset}`)}${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}├${widths.map(w => '─'.repeat(w)).join('┼')}┤${colors.reset}`);

        // Rows
        data.forEach((row, idx) => {
            console.log(`${colors.cyan}│${colors.reset}${row.map((cell, i) => ` ${String(cell || '')}${' '.repeat(widths[i] - String(cell || '').length - 1)}`).join(`${colors.cyan}│${colors.reset}`)}${colors.cyan}│${colors.reset}`);
        });

        console.log(`${colors.cyan}└${widths.map(w => '─'.repeat(w)).join('┴')}┘${colors.reset}`);
    },

    divider: (char = '─', color = colors.cyan) => {
        console.log(`${color}${char.repeat(process.stdout.columns || 80)}${colors.reset}`);
    },

    blank: () => {
        console.log('');
    }
};

module.exports = logger;
