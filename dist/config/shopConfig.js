"use strict";
module.exports = {
    categories: {
        essentials: {
            name: '🎒 Essentials',
            items: [
                {
                    id: 'pokeball',
                    name: 'Pokeball',
                    price: 500,
                    description: 'Basic ball for catching common Pokémon.',
                    emoji: '⚪',
                },
                {
                    id: 'ultraball',
                    name: 'Ultraball',
                    price: 2500,
                    description: 'High performance ball for rare catches.',
                    emoji: '🟡',
                },
                {
                    id: 'masterball',
                    name: 'Master Ball',
                    price: 25000,
                    description: 'The ultimate ball. Guaranteed catch!',
                    emoji: '🟣',
                },
            ],
        },
        boosters: {
            name: '🔥 Boosters',
            items: [
                {
                    id: 'hunt_boost',
                    name: 'Hunt Multiplier',
                    price: 15000,
                    description: '5x rarity luck for your next 20 hunts!',
                    emoji: '🔥',
                    type: 'booster',
                    amount: 20,
                },
            ],
        },
        social: {
            name: '💍 Social',
            items: [
                {
                    id: 'ring_of_promise',
                    name: 'Ring of Promise',
                    price: 100000,
                    description: 'Use this to marry your favorite character!',
                    emoji: '💍',
                },
            ],
        },
    },
};
