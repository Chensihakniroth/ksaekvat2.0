const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

// Gacha Themes
const themes = {
    genshin: colors.yellow,
    hsr: colors.magenta,
    wuwa: colors.cyan,
    zzz: colors.red,
    system: colors.blue
};

function getTimestamp() {
    return new Date().toISOString();
}

function getConsoleTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

function writeLog(level, message, error = null) {
    const timestamp = getTimestamp();
    const logFile = path.join(logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (error) {
        logEntry += `\nError: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`;
    }
    fs.appendFileSync(logFile, logEntry + '\n');
}

const logger = {
    info: (message) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.blue}ℹ${colors.reset} ${message}`);
        writeLog('info', message);
    },
    
    warn: (message) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.yellow}⚠${colors.reset} ${colors.bright}${message}${colors.reset}`);
        writeLog('warn', message);
    },
    
    error: (message, error = null) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.red}✕ ${colors.bright}${message}${colors.reset}`);
        if (error) {
            console.log(`${colors.red}${error.stack || error.message}${colors.reset}`);
        }
        writeLog('error', message, error);
    },
    
    success: (message) => {
        console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.green}✓${colors.reset} ${message}`);
        writeLog('success', message);
    },

    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.magenta}⚙${colors.reset} ${colors.italic}${message}${colors.reset}`);
            writeLog('debug', message);
        }
    },

    // AESTHETIC METHODS
    
    ascii: (text, color = colors.cyan) => {
        console.log(`${color}${text}${colors.reset}`);
    },

    header: (title) => {
        const line = '═'.repeat(60);
        console.log(`\n${colors.cyan}╔${line}╗`);
        console.log(`║ ${colors.bright}${title.toUpperCase().padEnd(58)} ${colors.cyan}║`);
        console.log(`╚${line}╝${colors.reset}`);
    },

    section: (title) => {
        console.log(`\n${colors.bright}${colors.blue}⦿ ${title.toUpperCase()}${colors.reset}`);
        console.log(`${colors.dim}${'─'.repeat(40)}${colors.reset}`);
    },

    item: (label, value, color = colors.white) => {
        console.log(`  ${colors.dim}•${colors.reset} ${label.padEnd(15)}: ${color}${value}${colors.reset}`);
    },

    table: (headers, rows) => {
        const colWidths = headers.map((h, i) => {
            return Math.max(h.length, ...rows.map(r => String(r[i]).length)) + 2;
        });

        const divider = '┼' + colWidths.map(w => '─'.repeat(w)).join('┼') + '┼';
        const top = '┌' + colWidths.map(w => '─'.repeat(w)).join('┬') + '┐';
        const bottom = '└' + colWidths.map(w => '─'.repeat(w)).join('┴') + '┘';

        console.log(colors.dim + top + colors.reset);
        console.log(colors.dim + '│' + colors.reset + headers.map((h, i) => `${colors.bright} ${h.padEnd(colWidths[i] - 1)} ${colors.reset}`).join(colors.dim + '│' + colors.reset) + colors.dim + '│' + colors.reset);
        console.log(colors.dim + divider + colors.reset);
        
        rows.forEach(row => {
            console.log(colors.dim + '│' + colors.reset + row.map((cell, i) => ` ${String(cell).padEnd(colWidths[i] - 1)} `).join(colors.dim + '│' + colors.reset) + colors.dim + '│' + colors.reset);
        });
        
        console.log(colors.dim + bottom + colors.reset);
    },

    box: (content, color = colors.cyan) => {
        const lines = content.split('\n');
        const width = Math.max(...lines.map(l => l.length)) + 4;
        const border = '─'.repeat(width);
        
        console.log(`${color}┌${border}┐${colors.reset}`);
        lines.forEach(line => {
            console.log(`${color}│${colors.reset}  ${line.padEnd(width - 2)} ${color}│${colors.reset}`);
        });
        console.log(`${color}└${border}┘${colors.reset}`);
    },

    divider: (char = '─', color = colors.dim) => {
        console.log(`${color}${char.repeat(62)}${colors.reset}`);
    },

    blank: () => {
        console.log('');
    },

    loader: (message) => {
        process.stdout.write(`${colors.dim}${getConsoleTimestamp()}${colors.reset} ${colors.yellow}⏳${colors.reset} ${message}... `);
        return {
            done: () => process.stdout.write(`${colors.green}DONE!${colors.reset}\n`),
            fail: (err) => process.stdout.write(`${colors.red}FAIL! (${err})${colors.reset}\n`)
        };
    }
};

module.exports = logger;
