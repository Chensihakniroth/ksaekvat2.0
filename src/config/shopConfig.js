module.exports = {
  categories: {
    characters: {
      name: '🎭 Characters',
      currency: 'star_dust',
      items: [
        {
          id: 'char_amber',
          name: 'Amber',
          price: 200,
          rarity: 4,
          description: 'The Outrider of the Knights of Favonius.',
          emoji: '🏹',
        },
        {
          id: 'char_kaeya',
          name: 'Kaeya',
          price: 200,
          rarity: 4,
          description: 'The Cavalry Captain of the Knights of Favonius.',
          emoji: '❄️',
        },
        {
          id: 'char_raiden',
          name: 'Raiden Shogun',
          price: 400,
          rarity: 5,
          description: 'The Almighty Narukami Ogosho, God of Eternity.',
          emoji: '⚡',
        },
        {
          id: 'char_furina',
          name: 'Furina',
          price: 400,
          rarity: 5,
          description: 'The Regina of All Waters, Kindreds, Peoples and Laws.',
          emoji: '💧',
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
