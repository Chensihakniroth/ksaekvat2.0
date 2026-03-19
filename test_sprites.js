const animalService = require('./dist/services/AnimalService').default;

async function test() {
  console.log('Testing zapdos...');
  const sprite = await animalService.getPokemonSprite('zapdos');
  console.log('Zapdos Sprite:', sprite);
  
  console.log('Testing pikachu...');
  const sprite2 = await animalService.getPokemonSprite('pikachu');
  console.log('Pikachu Sprite:', sprite2);
  
  console.log('Testing unknown (frog)...');
  const sprite3 = await animalService.getPokemonSprite('frog');
  console.log('Frog Sprite:', sprite3);
  
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
