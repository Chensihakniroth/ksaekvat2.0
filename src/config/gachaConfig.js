const gachaConfig = {
  baseUrl: 'http://bucket-production-4ca0.up.railway.app/gacha-images/',
  games: {
    genshin: {
      name: 'Genshin Impact',
      imagePath: 'gs/',
      animation: {
        5: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/5_star_gs.gif',
        4: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/4_star_gs.gif',
      },
    },
    hsr: {
      name: 'Honkai: Star Rail',
      imagePath: 'hsr/',
      animation: {
        5: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/5_star_hsr.gif',
        4: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/4_star_hsr.gif',
      },
    },
    wuwa: {
      name: 'Wuthering Waves',
      imagePath: 'wuwa_char/',
      animation: {
        5: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/5_star_wuwa.gif',
        4: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/4_star_wuwa.gif',
      },
    },
    zzz: {
      name: 'Zenless Zone Zero',
      imagePath: 'zzz/',
      animation: {
        5: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/5_star_zzz.gif',
        4: 'http://bucket-production-4ca0.up.railway.app/gacha-images/wish_animation_gif/4_star_zzz.gif',
      },
    },
  },
};

module.exports = gachaConfig;
