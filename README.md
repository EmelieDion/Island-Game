# Chaos Island

A small floating island in the sea that you can play with. Change the time of day, make it rain or snow, turn up the wind and throw beach balls at the island.

**Live:** https://emeliedion.github.io/island-game/

Made with Three.js and the `WebGPURenderer`. Works best in Chrome.

## Original Shadertoy shaders

| Used for | Shader | Author |
| --- | --- | --- |
| The sea | [Tileable Water Caustic](https://www.shadertoy.com/view/MdlXz8) | Dave_Hoskins |
| The northern lights | [Auroras](https://www.shadertoy.com/view/XtGGRt) | nimitz |

Both shaders are ported from GLSL to WGSL and used in node materials with `wgslFn`:

- `js/shaders/sea/fragment.wgsl`
- `js/shaders/aurora/fragment.wgsl`

The sky (sun, moon, stars, sunset) is my own WGSL shader in `js/shaders/sky/fragment.wgsl`.

Both Shadertoy shaders are licensed CC BY-NC-SA 3.0. This is a non-commercial school project.

## Interaction

- **Mouse:** move the mouse over the screen to change the light on the water. Left and right changes the speed, up and down changes how much it shines.
- **Look around:** drag to orbit, scroll to zoom.
- **Throw:** click to throw a beach ball. Balls bounce on the island and float on the waves.
- **Weather machine:**
  - **Time:** day and night, sunset, stars and moon.
  - **Rain** and **Snow:** particles moved by compute shaders. Snow slowly covers the ground and the roofs and melts again afterwards.
  - **Wind:** blows the rain and snow sideways and makes the waves higher.
- **Northern lights:** appear at night when it snows.

## Techniques

- Three.js `WebGPURenderer`
- WGSL fragment shaders through TSL (`wgslFn`)
- TSL compute shaders for rain and snow (`instancedArray`)
- Rapier physics (`@dimforge/rapier3d-compat`)
- Baked lighting from Blender

## My own Blender models

| Model | File | What I did |
| --- | --- | --- |
| House | `public/assets/island-game-assets.glb` | Modelled in Blender, lighting baked to `public/assets/island-game-assets.jpg` |
| Windmill | `public/assets/island-game-assets.glb` | Modelled in Blender |

## Other models

| Model | Author | License |
| --- | --- | --- |
| [Tree](https://poly.pizza/m/6Yjt8nIwLsD) | Marc Solà | CC BY 3.0 |
| [Tree](https://poly.pizza/m/6pwiq7hSrHr) | Poly by Google | CC BY 3.0 |
| [Sailboat](https://poly.pizza/m/1d76pfN4Dne) | Poly by Google | CC BY 3.0 |

The beach ball and the island itself are made in code.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` builds the site into `dist`. Every push to `main` is deployed to GitHub Pages.
