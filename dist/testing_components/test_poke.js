"use strict";
const axios = require('axios');
async function testPoke() {
    try {
        const res = await axios.get('https://pokeapi.co/api/v2/pokemon/pikachu');
        console.log("Pikachu:", res.data.sprites.other['official-artwork'].front_default);
        const char = await axios.get('https://pokeapi.co/api/v2/pokemon/charizard');
        console.log("Shiny Charizard:", char.data.sprites.other['official-artwork'].front_shiny || char.data.sprites.front_shiny);
    }
    catch (e) {
        console.error(e.message);
    }
}
testPoke();
