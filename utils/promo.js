const Promo = require('../models/Promo');
const logger = require('./logger.js');

/**
 * PROMO UTILITY (Gold Standard - MongoDB Edition)
 */

function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function createCode(type) {
    let prefix = '';
    let reward = {};

    if (type === 'riel') {
        prefix = '$';
        reward = { type: 'riel', amount: 1000000 };
    } else if (type === 'pulls') {
        prefix = 'pulls';
        reward = { type: 'pulls', amount: 1 };
    } else {
        return null;
    }

    const code = prefix + generateRandomString(6);
    await Promo.create({
        code,
        ...reward,
        usedBy: [],
        maxUses: 1
    });

    return code;
}

async function createCustomCode(code, type, amount, maxUses = 1) {
    await Promo.create({
        code,
        type,
        amount,
        usedBy: [],
        maxUses
    });
    return code;
}

async function redeemCode(userId, codeInput) {
    // Case-insensitive lookup using regex
    const promo = await Promo.findOne({ code: { $regex: new RegExp(`^${codeInput}$`, 'i') } });

    if (!promo) return { success: false, message: 'Invalid code! (っ˘ω˘ς)' };
    if (promo.usedBy.includes(userId)) return { success: false, message: 'You already used this code! (◕‿◕✿)' };
    if (promo.usedBy.length >= promo.maxUses) return { success: false, message: 'This code has reached its maximum uses! (っ˘ω˘ς)' };

    promo.usedBy.push(userId);
    await promo.save();

    return { success: true, reward: promo };
}

async function getAllCodes() {
    return await Promo.find({});
}

module.exports = {
    createCode,
    createCustomCode,
    redeemCode,
    getAllCodes
};