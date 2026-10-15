# Chaos Island

A small floating island in the sea that you can play with. Change the time of day, make it rain or snow, turn up the wind, throw beach balls, barrels and rocks, call down lightning or blow a gust of wind. Houses, trees, the windmill and the boat break apart and rebuild themselves. Or pull the time lever to rewind everything.

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
- **Start screen:** explains the controls. The `?` button in the top left opens it again, the speaker button turns the sound on or off.
- **Tools** (buttons at the bottom, or keys `1` to `5`). Click on the island to use them:
  - **Beach ball:** light and bouncy, floats high on the waves, knocks off roofs.
  - **Barrel:** floats half under water, breaks the top of a house.
  - **Rock:** heavy, sinks in the sea, smashes a whole house.
  - **Lightning:** a bolt from the sky with a flash of light that blows up everything around it.
  - **Wind gust:** blows away roofs, trees, the windmill blades, the boat and anything lying around.
- **Breakable world:** houses are built from separate pieces that fly apart when something hits them hard enough. Trees, the windmill and the boat can be knocked away too. After a few calm seconds everything rebuilds itself piece by piece.
- **Time lever** (or key `R`): everything you threw flies back into the sky and all houses rebuild at once.
- **Weather machine:**
  - **Time:** day and night, sunset, stars and moon.
  - **Rain** and **Snow:** particles moved by compute shaders. Snow slowly covers the ground, the roofs and the trees and melts again afterwards.
  - **Wind:** blows the rain and snow sideways, makes the waves higher and makes the windmill turn faster.
- **Northern lights:** appear at night when it snows.
- **Sailboat:** sails around the island and rocks on the waves.
- **Sound:** waves, rain, wind, thunder, impacts and a rewind sound, all generated with the Web Audio API (no sound files).

## Techniques

- Three.js `WebGPURenderer`
- WGSL fragment shaders through TSL (`wgslFn`)
- TSL compute shaders for rain and snow (`instancedArray`)
- Rapier physics (`@dimforge/rapier3d-compat`): collisions with the island, buoyancy on the waves, breakable houses, trees, windmill and boat
- Baked lighting from Blender
- Blender animation played with an `AnimationMixer` and controlled by the wind slider
- Procedural sound with the Web Audio API

## My own Blender models

| Model | File | What I did |
| --- | --- | --- |
| House | `public/assets/island-game-assets-animation.glb` | Modelled in Blender, lighting baked to `public/assets/island-game-assets.jpg` |
| Windmill | `public/assets/island-game-assets-animation.glb` | Modelled in Blender, animated the rotating blades in Blender. The speed of the animation follows the wind slider. |

## Other models

| Model | Author | License |
| --- | --- | --- |
| [Tree](https://poly.pizza/m/6Yjt8nIwLsD) | Marc Solà | CC BY 3.0 |
| [Tree](https://poly.pizza/m/6pwiq7hSrHr) | Poly by Google | CC BY 3.0 |
| [Sailboat](https://poly.pizza/m/1d76pfN4Dne) | Poly by Google | CC BY 3.0 |

The beach ball, the barrel, the rock, the island, the lightning and all icons are made in code.

The title font is [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy) from Google Fonts.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` builds the site into `dist`. Every push to `main` is deployed to GitHub Pages.
