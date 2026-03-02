const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');

const PROMO_FILE = path.join(__dirname, '..', 'data', 'promo_codes.json');

function loadCodes() {
    try {
        if (!fs.existsSync(PROMO_FILE)) {
            fs.writeFileSync(PROMO_FILE, JSON.stringify({}));
            return {};
        }
        const data = fs.readFileSync(PROMO_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('Error loading promo codes:', error);
        return {};
    }
}

function saveCodes(codes) {
    try {
        fs.writeFileSync(PROMO_FILE, JSON.stringify(codes, null, 2));
    } catch (error) {
        logger.error('Error saving promo codes:', error);
    }
}

function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function createCode(type) {
    const codes = loadCodes();
    let prefix = '';
    let reward = {};

    if (type === 'riel') {
        prefix = '$';
        reward = { type: 'riel', amount: 1000000 };
    } else if (type === 'pulls') {
        prefix = 'pulls';
        reward = { type: 'pulls', amount: 1 }; // 1 set of 10-pulls
    } else {
        return null;
    }

    const code = prefix + generateRandomString(6);
    codes[code] = {
        ...reward,
        usedBy: [],
        maxUses: 1,
        createdAt: Date.now()
    };

    saveCodes(codes);
    return code;
}

function createCustomCode(code, type, amount, maxUses = 1) {
    const codes = loadCodes();
    codes[code] = {
        type,
        amount,
        usedBy: [],
        maxUses,
        createdAt: Date.now()
    };
    saveCodes(codes);
    return code;
}

function redeemCode(userId, codeInput) {
    const codes = loadCodes();
    // Case-insensitive lookup
    const code = Object.keys(codes).find(k => k.toLowerCase() === codeInput.toLowerCase());
    const promo = codes[code];

    if (!promo) return { success: false, message: 'Invalid code! (っ˘ω˘ς)' };
    if (promo.usedBy.includes(userId)) return { success: false, message: 'You already used this code! (◕‿◕✿)' };
    if (promo.usedBy.length >= promo.maxUses) return { success: false, message: 'This code has reached its maximum uses! (っ˘ω˘ς)' };

    promo.usedBy.push(userId);
    saveCodes(codes);

    return { success: true, reward: promo };
}

function getAllCodes() {
    return loadCodes();
}

module.exports = {
    createCode,
    createCustomCode,
    redeemCode,
    getAllCodes
};