// Port of "Tileable Water Caustic" by Dave_Hoskins - https://www.shadertoy.com/view/MdlXz8
fn sea(fragCoord: vec2f, iResolution: vec2f, iTime: f32, glints: f32) -> vec4f {
  let TAU = 6.28318530718;
  let MAX_ITER = 5;

  let time = iTime * 0.5 + 23.0;
  let uv = fragCoord / iResolution;

  let p = (uv * TAU) % vec2f(TAU) - 250.0;
  var i = p;
  var c = 1.0;
  let inten = 0.005;

  for (var n = 0; n < MAX_ITER; n++) {
    let t = time * (1.0 - (3.5 / f32(n + 1)));
    i = p + vec2f(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2f(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
  }
  c /= f32(MAX_ITER);
  c = 1.17 - pow(c, 1.4);

  let colour = clamp(vec3f(pow(abs(c), 8.0)) * glints + vec3f(0.0, 0.35, 0.5), vec3f(0.0), vec3f(1.0));

  return vec4f(colour, 1.0);
}
