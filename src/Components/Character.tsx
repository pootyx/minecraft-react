import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Box3 } from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { BlockType } from './Block';

function Character({
  blocks,
  playerId,
  socket,
}: { blocks: BlockType[]; playerId: string; socket: WebSocket | null }) {
  const { camera } = useThree();
  const position = useRef(new Vector3(1, 200, 1));
  const velocity = useRef(new Vector3());
  const [sub, get] = useKeyboardControls();

  const characterBox = new Box3(
    new Vector3(-0.375, -0.9, -0.375),
    new Vector3(0.375, 0.9, 0.375)
  );

  const checkCollision = (newPosition: Vector3) => {
    characterBox.setFromCenterAndSize(
      newPosition,
      new Vector3(0.75, 1.8, 0.75)
    );
    for (const block of blocks) {
      const blockBox = new Box3(
        new Vector3(...block.position),
        new Vector3(...block.position).add(new Vector3(1, 1, 1))
      );
      if (characterBox.intersectsBox(blockBox)) {
        return true;
      }
    }
    return false;
  };

  const isOnGround = () => {
    const feetPosition = position.current.clone().sub(new Vector3(0, 0.9, 0));
    return checkCollision(feetPosition);
  };

  const tryMove = (newPosition: Vector3, direction: Vector3) => {
    if (!checkCollision(newPosition)) {
      return newPosition;
    }

    // Try stepping up
    const stepHeight = 0.5;
    const stepUpPosition = newPosition
      .clone()
      .add(new Vector3(0, stepHeight, 0));
    if (!checkCollision(stepUpPosition)) {
      return stepUpPosition;
    }

    // If can't step up, try sliding
    const slideX = newPosition.clone().setX(position.current.x);
    if (!checkCollision(slideX)) {
      return slideX;
    }

    const slideZ = newPosition.clone().setZ(position.current.z);
    if (!checkCollision(slideZ)) {
      return slideZ;
    }

    return position.current.clone();
  };

  useFrame((state, delta) => {
    const { forward, backward, left, right, jump } = get();
    const direction = new Vector3();

    // Calculate movement direction
    const frontVector = new Vector3(0, 0, Number(forward) - Number(backward));
    const sideVector = new Vector3(Number(left) - Number(right), 0, 0);
    direction.addVectors(frontVector, sideVector).normalize();

    // Apply camera direction to movement
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const rightDirection = new Vector3();
    rightDirection
      .crossVectors(new Vector3(0, 1, 0), cameraDirection)
      .normalize();

    const finalDirection = new Vector3();
    finalDirection
      .addScaledVector(cameraDirection, frontVector.z)
      .addScaledVector(rightDirection, sideVector.x)
      .normalize();

    // Apply gravity
    const onGround = isOnGround();
    if (!onGround) {
      velocity.current.y -= 20 * delta; // Increased gravity
    } else {
      velocity.current.y = Math.max(0, velocity.current.y);
    }

    // Apply jump
    if (jump && onGround) {
      velocity.current.y = 5;
    }

    // Calculate new position
    const speed = 5;
    const movement = finalDirection.multiplyScalar(speed * delta);
    const newPosition = position.current.clone().add(movement);
    newPosition.y += velocity.current.y * delta;

    // Try to move and handle collisions
    const finalPosition = tryMove(newPosition, finalDirection);

    // Update velocity based on actual movement
    const actualMovement = finalPosition.clone().sub(position.current);
    velocity.current.x = actualMovement.x / delta;
    velocity.current.z = actualMovement.z / delta;

    if (onGround && velocity.current.y <= 0) {
      velocity.current.y = 0;
    }

    // Apply air resistance
    const airResistance = 0.1;
    velocity.current.x *= 1 - airResistance;
    velocity.current.z *= 1 - airResistance;

    // Update position
    position.current.copy(finalPosition);

    // Update camera position
    camera.position.copy(position.current);

    // Send position updates to server
    if (socket) {
      socket.send(
        JSON.stringify({
          type: 'playerMove',
          playerId: playerId,
          position: position.current.toArray(),
        })
      );
    }
  });

  return null;
}

export default Character;
