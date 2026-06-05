"use strict";
// Cooldown system disabled - all cooldowns removed
const cooldowns = new Map();
module.exports = {
    setCooldown: (_key) => {
        // No-op: cooldowns disabled
    },
    isOnCooldown: (_key, _cooldownTime) => {
        return false; // Always return false - no cooldowns
    },
    getTimeLeft: (_key, _cooldownTime) => {
        return 0; // No time left - no cooldowns
    },
    clearAll: () => {
        cooldowns.clear();
    },
    clear: (key) => {
        cooldowns.delete(key);
    },
};
