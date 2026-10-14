fn sky(dir: vec3f, sunDir: vec3f, day: f32, iTime: f32) -> vec4f {
  let d = normalize(dir);
  let h = clamp(d.y, -1.0, 1.0);
  let up = pow(clamp(h, 0.0, 1.0), 0.45);

  let dayTop = vec3f(0.20, 0.47, 0.90);
  let dayHorizon = vec3f(0.70, 0.85, 0.97);
  let nightTop = vec3f(0.008, 0.012, 0.045);
  let nightHorizon = vec3f(0.04, 0.06, 0.14);

  let dayCol = mix(dayHorizon, dayTop, up);
  let nightCol = mix(nightHorizon, nightTop, up);
  var col = mix(nightCol, dayCol, day);

  let sunDot = max(dot(d, sunDir), 0.0);
  let sunsetStrength = 1.0 - smoothstep(0.0, 0.35, abs(sunDir.y));
  let horizonBand = 1.0 - smoothstep(0.0, 0.45, abs(h));
  let sunsetCol = mix(vec3f(0.95, 0.35, 0.25), vec3f(1.0, 0.65, 0.3), sunDot);
  col = mix(col, sunsetCol, sunsetStrength * horizonBand * (0.35 + 0.65 * pow(sunDot, 2.0)));

  let sunVisible = smoothstep(-0.05, 0.05, sunDir.y);
  let sunDisc = smoothstep(0.9990, 0.9996, sunDot);
  let sunGlow = pow(sunDot, 64.0) * 0.6 + pow(sunDot, 8.0) * 0.15;
  col += vec3f(1.0, 0.92, 0.75) * (sunDisc * 2.0 + sunGlow) * sunVisible;

  let moonDot = max(dot(d, -sunDir), 0.0);
  let moonVisible = smoothstep(-0.05, 0.05, -sunDir.y);
  let moonDisc = smoothstep(0.9993, 0.9996, moonDot);
  col += vec3f(0.85, 0.88, 1.0) * (moonDisc * 1.2 + pow(moonDot, 120.0) * 0.15) * moonVisible;

  let cell = floor(d * 220.0);
  let rnd = skyHash(cell);
  let twinkle = 0.6 + 0.4 * sin(iTime * (2.0 + rnd * 4.0) + rnd * 60.0);
  let star = step(0.9965, rnd) * twinkle * smoothstep(0.0, 0.25, h);
  col += vec3f(star) * (1.0 - day);

  let below = smoothstep(0.0, -0.35, h);
  col = mix(col, col * 0.35, below);

  return vec4f(col, 1.0);
}

fn skyHash(p: vec3f) -> f32 {
  return fract(sin(dot(p, vec3f(127.1, 311.7, 74.7))) * 43758.5453);
}
