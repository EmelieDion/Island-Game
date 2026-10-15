import * as THREE from 'three/webgpu';

const BREAK_FORCE = 5;
const REPAIR_DELAY = 6;
const PIECE_REPAIR_TIME = 1.2;
const PIECE_REPAIR_GAP = 0.15;

const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();

export const createBreakables = (physics, scene) => {
  const { RAPIER, world } = physics;
  const houses = [];
  const pieceByCollider = new Map();
  let now = 0;

  const addHouse = (house) => {
    house.updateMatrixWorld(true);
    const meshes = [];
    house.traverse((child) => {
      if (child.isMesh && (child.name.startsWith('Cube') || child.name.startsWith('Cylinder'))) meshes.push(child);
    });

    const record = { pieces: [], lastHit: -Infinity, repairing: false, repairStart: 0 };

    meshes.forEach((mesh) => {
      mesh.matrixWorld.decompose(position, quaternion, scale);
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getSize(size).multiply(scale);
      mesh.geometry.boundingBox.getCenter(center).multiply(scale);
      scene.attach(mesh);

      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed()
          .setTranslation(position.x, position.y, position.z)
          .setRotation(quaternion),
      );
      const collider = world.createCollider(
        RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
          .setTranslation(center.x, center.y, center.z)
          .setDensity(0.6)
          .setFriction(0.8)
          .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
        body,
      );

      const piece = {
        mesh,
        body,
        house: record,
        broken: false,
        isRoof: mesh.name.startsWith('Cylinder'),
        home: { position: position.clone(), quaternion: quaternion.clone() },
        from: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() },
      };
      record.pieces.push(piece);
      pieceByCollider.set(collider.handle, piece);
    });

    record.pieces.sort((a, b) => a.home.position.y - b.home.position.y);
    houses.push(record);
  };

  const addStatic = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    box.getSize(size);
    box.getCenter(center);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
        .setTranslation(center.x, center.y, center.z)
        .setFriction(0.8),
    );
  };

  const breakPiece = (piece, velocity) => {
    piece.broken = true;
    piece.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    const mass = piece.body.mass();
    const push = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize().multiplyScalar(mass * 3);
    piece.body.applyImpulse({ x: push.x, y: push.y + mass * 2, z: push.z }, true);
    piece.body.applyTorqueImpulse({
      x: (Math.random() - 0.5) * mass * 0.2,
      y: (Math.random() - 0.5) * mass * 0.2,
      z: (Math.random() - 0.5) * mass * 0.2,
    }, true);
  };

  const breakAround = (house, hitPiece, point, velocity) => {
    if (house.repairing) {
      house.pieces.filter((piece) => piece.broken).forEach((piece) => {
        piece.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
      });
      house.repairing = false;
    }
    house.lastHit = now;

    const toBreak = new Set([hitPiece]);
    house.pieces.forEach((piece) => {
      if (!piece.broken && piece.mesh.position.distanceTo(point) < 0.75) toBreak.add(piece);
    });

    let changed = true;
    while (changed) {
      changed = false;
      house.pieces.forEach((piece) => {
        if (piece.broken || toBreak.has(piece)) return;
        const falls = [...toBreak].some((below) => {
          const higher = piece.home.position.y > below.home.position.y + 0.2;
          const above = Math.hypot(
            piece.home.position.x - below.home.position.x,
            piece.home.position.z - below.home.position.z,
          ) < 0.6;
          return piece.isRoof || (higher && above);
        });
        if (falls) {
          toBreak.add(piece);
          changed = true;
        }
      });
    }

    toBreak.forEach((piece) => {
      if (!piece.broken) breakPiece(piece, velocity);
    });
  };

  physics.onCollision((handle1, handle2) => {
    const piece = pieceByCollider.get(handle1) || pieceByCollider.get(handle2);
    const item = physics.itemByCollider.get(handle1) || physics.itemByCollider.get(handle2);
    if (!piece || !item) return;
    const velocity = item.body.linvel();
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
    if (speed * item.power < BREAK_FORCE) return;
    breakAround(piece.house, piece, item.body.translation(), velocity);
  });

  const repair = (house) => {
    const broken = house.pieces.filter((piece) => piece.broken);
    if (!broken.length) return;

    if (!house.repairing && now - house.lastHit > REPAIR_DELAY) {
      house.repairing = true;
      house.repairStart = now;
      broken.forEach((piece) => {
        piece.from.position.copy(piece.mesh.position);
        piece.from.quaternion.copy(piece.mesh.quaternion);
        piece.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
      });
    }

    if (!house.repairing) return;

    let done = true;
    broken.forEach((piece, index) => {
      const t = THREE.MathUtils.clamp((now - house.repairStart - index * PIECE_REPAIR_GAP) / PIECE_REPAIR_TIME, 0, 1);
      const eased = t * t * (3 - 2 * t);
      position.lerpVectors(piece.from.position, piece.home.position, eased);
      quaternion.slerpQuaternions(piece.from.quaternion, piece.home.quaternion, eased);
      piece.body.setNextKinematicTranslation(position);
      piece.body.setNextKinematicRotation(quaternion);
      if (t < 1) done = false;
    });

    if (done) {
      broken.forEach((piece) => {
        piece.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        piece.body.setTranslation(piece.home.position, true);
        piece.body.setRotation(piece.home.quaternion, true);
        piece.mesh.position.copy(piece.home.position);
        piece.mesh.quaternion.copy(piece.home.quaternion);
        piece.broken = false;
      });
      house.repairing = false;
    }
  };

  const update = (elapsedTime) => {
    now = elapsedTime;
    houses.forEach((house) => {
      repair(house);
      house.pieces.forEach((piece) => {
        if (!piece.broken) return;
        const translation = piece.body.translation();
        piece.mesh.position.set(translation.x, translation.y, translation.z);
        piece.mesh.quaternion.copy(piece.body.rotation());
      });
    });
  };

  return { addHouse, addStatic, update };
};
