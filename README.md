# Chaos Island

A floating island sandbox: control the weather, throw things at the village and watch it rebuild itself.

**Live:** https://emeliedion.github.io/island-game/

## Shadertoy shaders

- Sea: [Tileable Water Caustic](https://www.shadertoy.com/view/MdlXz8) by Dave_Hoskins
- Northern lights: [Auroras](https://www.shadertoy.com/view/XtGGRt) by nimitz

Ported to WGSL in `js/shaders/`. The sky is a custom WGSL shader (not from Shadertoy).

## Controls

- Mouse movement changes the speed and brightness of the light on the water
- Drag to look around, scroll to zoom
- Click to use a tool: beach ball, barrel, rock, lightning or wind gust
- Weather machine: time, rain, snow, wind
- Time lever (`R`): rewind everything
- Snow at night shows the northern lights

## Extras

- Rapier physics: everything breaks apart, floats and rebuilds itself
- TSL compute shaders for rain and snow
- Sound with the Web Audio API

## My Blender models

- House: modelled and baked (`island-game-assets.jpg`)
- Windmill: modelled and animated, blade speed follows the wind slider

## Credits

- [Tree](https://poly.pizza/m/6Yjt8nIwLsD) by Marc Solà (CC BY 3.0)
- [Tree](https://poly.pizza/m/6pwiq7hSrHr) by Poly by Google (CC BY 3.0)
- [Sailboat](https://poly.pizza/m/1d76pfN4Dne) by Poly by Google (CC BY 3.0)
