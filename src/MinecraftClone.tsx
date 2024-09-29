import { Physics, useBox } from '@react-three/cannon';
import {
  Edges,
  PointerLockControls,
  Sky,
  useKeyboardControls,
} from '@react-three/drei';
import {
  Canvas,
  ThreeEvent,
  useFrame,
  useLoader,
  useThree,
} from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {
  BufferGeometry,
  Material,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  TextureLoader,
  Vector3,
} from 'three';

// Defining BlockProps for the Block component
interface BlockProps {
  position: [number, number, number];
  onRemove: () => void;
  isSelected: boolean;
}

// Defining BlockType for block state management
interface BlockType {
  key: string;
  position: [number, number, number];
}

// Character component
function Character() {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: [0, 3, 0],
    fixedRotation: true,
    args: [1, 1, 1], // Player hitbox dimensions
    angularDamping: 1.0, // Prevent unwanted rotations
    material: {
      friction: 0.0, // Remove friction to allow consistent movement
    },
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((v) => {
      velocity.current = v;
    });
    return unsubscribe;
  }, [api.velocity]);

  const [sub, get] = useKeyboardControls();
  const { camera } = useThree();

  useFrame(() => {
    const { forward, backward, left, right, jump } = get();
    const direction = new Vector3();

    // Calculate movement direction based on input keys
    const frontVector = new Vector3(0, 0, Number(forward) - Number(backward));
    const sideVector = new Vector3(Number(left) - Number(right), 0, 0);
    direction.addVectors(frontVector, sideVector).normalize();

    // Extract only the camera yaw (horizontal direction) to use for movement
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep the movement horizontal
    cameraDirection.normalize();

    // Create the right direction vector based on the camera direction
    const rightDirection = new Vector3();
    rightDirection
      .crossVectors(new Vector3(0, 1, 0), cameraDirection)
      .normalize();

    // Final movement direction calculation
    const finalDirection = new Vector3();
    finalDirection
      .addScaledVector(cameraDirection, frontVector.z) // Move forward/backward in camera direction
      .addScaledVector(rightDirection, sideVector.x) // Move left/right in strafe direction
      .normalize();

    // Get current vertical velocity to maintain jumping or falling motion
    const yVelocity = velocity.current[1];

    // Movement speed
    const speed = 5;

    if (direction.length() > 0) {
      // Set velocity based on the calculated direction and speed, keeping y-axis velocity unchanged
      api.velocity.set(
        finalDirection.x * speed,
        yVelocity,
        finalDirection.z * speed
      );
    } else {
      // If no input, retain the current y velocity while stopping horizontal movement
      api.velocity.set(0, yVelocity, 0);
    }

    // Handle jumping when on the ground
    if (jump && Math.abs(yVelocity) < 0.05) {
      api.velocity.set(velocity.current[0], 5, velocity.current[2]);
    }

    // Update camera position to follow the player
    if (ref.current) {
      const playerPosition = new Vector3();
      ref.current.getWorldPosition(playerPosition);
      camera.position.set(
        playerPosition.x,
        playerPosition.y + 1.0,
        playerPosition.z
      );
    }
  });

  return null;
}

// Block component
function Block({
  position,
  onRemove,
  handlePlaceBlock,
  isSelected,
}: BlockProps & {
  handlePlaceBlock: (position: [number, number, number]) => void;
}) {
  const ref = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const [api] = useBox(
    () => ({
      type: 'Static',
      position,
      material: {
        friction: 0.0, // Remove friction to allow consistent movement
      },
    }),
    ref
  );

  // Load the textures
  const dirtTexture = useLoader(TextureLoader, '/textures/dirt.png');
  const grassTexture = useLoader(TextureLoader, '/textures/grass.png');

  const [cracks, setCracks] = useState(0);
  const [mining, setMining] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (mining) {
      interval = setInterval(() => {
        setCracks((prev) => prev + 1);
      }, 1000);

      if (cracks >= 3) {
        clearInterval(interval);
        setTimeout(() => {
          api.current?.remove(); // Correctly remove the physics body from the world
          onRemove();
        }, 300);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cracks, mining, onRemove, api]);

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    if (event.nativeEvent.button === 0) {
      setMining(true);
    } else if (event.nativeEvent.button === 2) {
      // Handle right-click for block placement
      event.stopPropagation(); // Prevent any parent events

      // Determine which face of the block was clicked and place a new block accordingly
      const intersectPoint = event.point;
      const faceNormal = event.face?.normal;

      if (faceNormal) {
        // Calculate the position to place the new block based on the clicked face
        const newBlockPosition = new Vector3()
          .copy(intersectPoint)
          .add(faceNormal)
          .floor()
          .addScalar(0.5)
          .floor();

        // Convert to tuple to match handlePlaceBlock type
        const newBlockPositionTuple: [number, number, number] = [
          newBlockPosition.x,
          newBlockPosition.y,
          newBlockPosition.z,
        ];

        // Check if there is already a block at this position before placing
        handlePlaceBlock(newBlockPositionTuple);
      }
    }
  };

  const handlePointerUp = () => {
    setMining(false);
    setCracks(0);
  };

  const materials = [
    new MeshStandardMaterial({
      map: dirtTexture,
      opacity: 1 - cracks * 0.3,
      transparent: true,
    }), // right face (+X)
    new MeshStandardMaterial({
      map: dirtTexture,
      opacity: 1 - cracks * 0.3,
      transparent: true,
    }), // left face (-X)
    new MeshStandardMaterial({
      map: grassTexture,
      opacity: 1 - cracks * 0.3,
      transparent: true,
    }), // top face (+Y)
    new MeshStandardMaterial({
      map: dirtTexture,
      opacity: 1 - cracks * 0.3,
      transparent: true,
    }), // bottom face (-Y)
    new MeshStandardMaterial({
      map: dirtTexture,
      opacity: 1 - cracks * 0.3,
      transparent: true,
    }), // front face (+Z)
    new MeshStandardMaterial({
      map: dirtTexture,
      opacity: 1 - cracks * 0.3,
      transparent: true,
    }), // back face (-Z)
  ];

  return (
    <mesh
      ref={ref}
      position={position}
      castShadow
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      material={materials}
    >
      <boxGeometry args={[1, 1, 1]} />
      {isSelected && <Edges color="red" />}
    </mesh>
  );
}

function World({
  blocks,
  handleRemoveBlock,
  handlePlaceBlock,
  selectedBlock,
}: {
  blocks: BlockType[];
  handleRemoveBlock: (key: string) => void;
  handlePlaceBlock: (position: [number, number, number]) => void;
  selectedBlock: string | null;
}) {
  return (
    <>
      {blocks.map((block) => (
        <Block
          key={block.key}
          position={block.position}
          onRemove={() => handleRemoveBlock(block.key)}
          handlePlaceBlock={handlePlaceBlock}
          isSelected={block.key === selectedBlock}
        />
      ))}
    </>
  );
}

// RaycastSelector component to determine the selected block
function RaycastSelector({
  setSelectedBlock,
}: {
  setSelectedBlock: (uuid: string | null) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());

  useFrame(() => {
    // Raycasting to determine the selected block
    raycaster.current.set(
      camera.position,
      camera.getWorldDirection(new Vector3())
    );
    const intersects = raycaster.current.intersectObjects(
      scene.children,
      false
    );
    if (intersects.length > 0) {
      const intersectedBlock = intersects[0].object;
      setSelectedBlock(intersectedBlock.uuid);
    } else {
      setSelectedBlock(null);
    }
  });

  return null;
}

function MinecraftClone() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  useEffect(() => {
    const initialBlocks: BlockType[] = [];
    const size = 10;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        initialBlocks.push({
          key: `${x}-0-${z}`,
          position: [x, 0, z],
        });
      }
    }
    setBlocks(initialBlocks);
  }, []);

  const handleRemoveBlock = (key: string) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.key !== key));
  };

  const handlePlaceBlock = (position: [number, number, number]) => {
    const newKey = `${position[0]}-${position[1]}-${position[2]}`;
    if (blocks.some((block) => block.key === newKey)) {
      console.log('Block already exists at this position:', position);
      return;
    }

    setBlocks((prevBlocks) => [
      ...prevBlocks,
      {
        key: newKey,
        position,
      },
    ]);
  };

  return (
    <Canvas>
      <Sky />
      <PointerLockControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Physics>
        <World
          blocks={blocks}
          handleRemoveBlock={handleRemoveBlock}
          handlePlaceBlock={handlePlaceBlock}
          selectedBlock={selectedBlock}
        />
        <Character />
        <RaycastSelector setSelectedBlock={setSelectedBlock} />
      </Physics>
    </Canvas>
  );
}
export default MinecraftClone;
