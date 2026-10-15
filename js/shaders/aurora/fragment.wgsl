// Port of "Auroras" by nimitz (@stormoid) - https://www.shadertoy.com/view/XtGGRt - CC BY-NC-SA 3.0
fn aurora(rd: vec3f, iTime: f32, amount: f32) -> vec4f {
  var col = vec4f(0.0);
  var avgCol = vec4f(0.0);
  let ro = vec3f(0.0);

  if (amount < 0.001 || rd.y <= 0.0) {
    return col;
  }

  for (var j = 0.0; j < 18.0; j += 1.0) {
    let i = j * 2.8;
    let offs = 0.006 * auroraHash21(rd.xz * 1000.0) * smoothstep(0.0, 15.0, i);
    var pt = ((0.8 + pow(i, 1.4) * 0.002) - ro.y) / (rd.y * 2.0 + 0.4);
    pt -= offs;
    let bpos = ro + pt * rd;
    let p = bpos.zx;
    let rzt = auroraTriNoise2d(p, 0.06, iTime);
    let col2 = vec4f((sin(1.0 - vec3f(2.15, -0.5, 1.2) + i * 0.043) * 0.5 + 0.5) * rzt, rzt);
    avgCol = mix(avgCol, col2, 0.7);
    col += avgCol * exp2(-i * 0.065 - 2.5) * smoothstep(0.0, 5.0, i) * 2.8;
  }

  col *= clamp(rd.y * 15.0 + 0.4, 0.0, 1.0);
  return col * 1.8 * amount;
}

fn auroraMm2(a: f32) -> mat2x2f {
  let c = cos(a);
  let s = sin(a);
  return mat2x2f(c, s, -s, c);
}

fn auroraTri(x: f32) -> f32 {
  return clamp(abs(fract(x) - 0.5), 0.01, 0.49);
}

fn auroraTri2(p: vec2f) -> vec2f {
  return vec2f(auroraTri(p.x) + auroraTri(p.y), auroraTri(p.y + auroraTri(p.x)));
}

fn auroraTriNoise2d(pIn: vec2f, spd: f32, time: f32) -> f32 {
  var z = 1.8;
  var z2 = 2.5;
  var rz = 0.0;
  var p = pIn * auroraMm2(pIn.x * 0.06);
  var bp = p;
  let m2 = mat2x2f(0.95534, 0.29552, -0.29552, 0.95534);
  let negM2 = m2 * -1.0;

  for (var i = 0.0; i < 5.0; i += 1.0) {
    var dg = auroraTri2(bp * 1.85) * 0.75;
    dg = dg * auroraMm2(time * spd);
    p -= dg / z2;

    bp *= 1.3;
    z2 *= 0.45;
    z *= 0.42;
    p *= 1.21 + (rz - 1.0) * 0.02;

    rz += auroraTri(p.x + auroraTri(p.y)) * z;
    p = p * negM2;
  }
  return clamp(1.0 / pow(rz * 29.0, 1.3), 0.0, 0.55);
}

fn auroraHash21(n: vec2f) -> f32 {
  return fract(sin(dot(n, vec2f(12.9898, 4.1414))) * 43758.5453);
}
