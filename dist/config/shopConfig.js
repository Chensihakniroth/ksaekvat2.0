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
        themes: {
            name: '🎨 Themes',
            items: [
                {
                    id: 'theme_sakura',
                    name: 'Sakura Garden',
                    price: 50000,
                    description: 'A beautiful pink theme with falling cherry blossoms.',
                    emoji: '🌸',
                    color: '#FFB7C5',
                    image: 'https://i.imgur.com/example_sakura.png'
                },
                {
                    id: 'theme_cyberpunk',
                    name: 'Night City',
                    price: 75000,
                    description: 'Neon lights and dark alleys for a futuristic vibe.',
                    emoji: '🏙️',
                    color: '#00F0FF',
                    image: 'https://i.imgur.com/example_cyberpunk.png'
                },
                {
                    id: 'theme_ocean',
                    name: 'Ocean Abyss',
                    price: 50000,
                    description: 'Deep blue mystery from the bottom of the sea.',
                    emoji: '🌊',
                    color: '#0077BE',
                    image: 'https://i.imgur.com/example_ocean.png'
                }
            ],
        },
    },
};
