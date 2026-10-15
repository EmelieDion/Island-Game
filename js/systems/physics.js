import RAPIER from '@dimforge/rapier3d-compat';

const STEP = 1 / 60;
const SEA_RADIUS = 30;

export const createPhysics = async (terrain) => {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = STEP;

  const vertices = new Float32Array(terrain.geometry.attributes.position.array);
  const indices = Uint32Array.from({ length: vertices.length / 3 }, (_, i) => i);
  world.createCollider(RAPIER.ColliderDesc.trimesh(vertices, indices).setFriction(0.9));

  const items = [];
  let accumulator = 0;

  const add = (mesh, colliderDesc, { position, velocity, size, floatiness }) => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setLinvel(velocity.x, velocity.y, velocity.z)
        .setCcdEnabled(true),
    );
    world.createCollider(colliderDesc, body);
    const item = { mesh, body, size, floatiness };
    items.push(item);
    return item;
  };

  const remove = (item) => {
    world.removeRigidBody(item.body);
    item.mesh.removeFromParent();
    items.splice(items.indexOf(item), 1);
  };

  const float = (item, waterHeight) => {
    const position = item.body.translation();
    const inSea = Math.hypot(position.x, position.z) < SEA_RADIUS;
    const depth = waterHeight(position.x, position.z) - (position.y - item.size);
    if (!inSea || depth <= 0) {
      item.body.setLinearDamping(0.05);
      item.body.setAngularDamping(0.1);
      return;
    }
    const submerged = Math.min(depth / (item.size * 2), 1);
    const lift = item.body.mass() * 9.81 * item.floatiness * submerged * STEP;
    item.body.applyImpulse({ x: 0, y: lift, z: 0 }, true);
    item.body.setLinearDamping(1.5);
    item.body.setAngularDamping(1.5);
  };

  const update = (deltaTime, waterHeight) => {
    accumulator += Math.min(deltaTime, 0.1);
    while (accumulator >= STEP) {
      items.forEach((item) => float(item, waterHeight));
      world.step();
      accumulator -= STEP;
    }

    [...items].forEach((item) => {
      const position = item.body.translation();
      if (position.y < -40) {
        remove(item);
        return;
      }
      item.mesh.position.set(position.x, position.y, position.z);
      item.mesh.quaternion.copy(item.body.rotation());
    });
  };

  return { RAPIER, items, add, remove, update };
};
