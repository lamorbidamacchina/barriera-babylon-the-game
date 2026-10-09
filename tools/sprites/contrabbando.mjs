// Sprite sheet for tools/sprite-preview.mjs: the veggies of the Contrabbando,
// at the sizes of the first and the last recipe.
import { VEGGIES, draw } from '../../src/games/contrabbando/textures.js';
import { RECIPES } from '../../src/games/contrabbando/recipes.js';

const sizes = [RECIPES[0].size, RECIPES[RECIPES.length - 1].size];

export default sizes.flatMap((size) =>
  Object.entries(VEGGIES).map(([type, v]) => {
    const w = Math.round(v.w * size);
    const h = Math.round(v.h * size);
    return { name: `${type}@${size}`, w, h, draw: (p) => draw[type](p, w, h) };
  }),
);
