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

enum BlockTypes {
  DIRT = 0,
  GRASS = 1,
  WOOD = 2,
  STONE = 3,
  SAND = 4,
}

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
  uuid: string; // Add this line
  type: BlockTypes;
}

// Character component
function Character() {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: [0, 3, 0],
    fixedRotation: true,
    args: [0.75, 1.8, 0.75], // Player hitbox dimensions
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
  uuid,
  type,
}: BlockProps & {
  handlePlaceBlock: (
    position: [number, number, number],
    normal: [number, number, number]
  ) => void;
  uuid: string;
  type: BlockTypes;
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
  const stoneTexture = useLoader(TextureLoader, '/textures/stone.png');
  const sandTexture = useLoader(TextureLoader, '/textures/sand.png');
  const woodTexture = useLoader(TextureLoader, '/textures/wood.png');

  const [cracks, setCracks] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isSelected && cracks > 0) {
      interval = setInterval(() => {
        setCracks((prev) => {
          if (prev >= 3 && interval) {
            clearInterval(interval);
            api.current?.remove();
            onRemove();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cracks, isSelected, onRemove, api]);

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    if (event.nativeEvent.button === 0 && isSelected) {
      setCracks((prev) => prev + 1);
    } else if (event.nativeEvent.button === 2) {
      event.stopPropagation();
      const faceNormal = event.face?.normal;

      if (faceNormal) {
        const normalArray: [number, number, number] = [
          faceNormal.x,
          faceNormal.y,
          faceNormal.z,
        ];
        handlePlaceBlock(position, normalArray);
      }
    }
  };

  const handlePointerUp = () => {
    setCracks(0);
  };

  const getTexture = (blockType: BlockTypes) => {
    switch (blockType) {
      case BlockTypes.DIRT:
        return dirtTexture;
      case BlockTypes.GRASS:
        return grassTexture;
      case BlockTypes.WOOD:
        return woodTexture;
      case BlockTypes.STONE:
        return stoneTexture;
      case BlockTypes.SAND:
        return sandTexture;
      default:
        return dirtTexture;
    }
  };

  const texture = getTexture(type);

  const material = new MeshStandardMaterial({
    map: texture,
    opacity: 1 - cracks * 0.3,
    transparent: true,
  });

  return (
    <mesh
      ref={ref}
      position={position}
      castShadow
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      material={material}
      uuid={uuid} // Set the UUID here
    >
      <boxGeometry args={[1, 1, 1]} />
      {isSelected && <Edges color="green" />}
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
  handlePlaceBlock: (
    position: [number, number, number],
    normal: [number, number, number]
  ) => void;
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
          isSelected={block.uuid === selectedBlock}
          uuid={block.uuid}
          type={block.type}
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
  const [currentBlockType, setCurrentBlockType] = useState<BlockTypes>(
    BlockTypes.DIRT
  );

  useEffect(() => {
    const initialBlocks: BlockType[] = [];
    const size = 10;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        initialBlocks.push({
          key: `${x}-0-${z}`,
          position: [x, 0, z],
          uuid: Math.random().toString(36).substr(2, 9),
          type: BlockTypes.GRASS,
        });
      }
    }
    setBlocks(initialBlocks);
  }, []);

  const handleRemoveBlock = (key: string) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.key !== key));
    setSelectedBlock(null);
  };

  const handlePlaceBlock = (
    position: [number, number, number],
    normal: [number, number, number]
  ) => {
    const newPosition: [number, number, number] = [
      position[0] + normal[0],
      position[1] + normal[1],
      position[2] + normal[2],
    ];

    const newKey = `${newPosition[0]}-${newPosition[1]}-${newPosition[2]}`;
    if (blocks.some((block) => block.key === newKey)) {
      console.log('Block already exists at this position:', newPosition);
      return;
    }

    setBlocks((prevBlocks) => [
      ...prevBlocks,
      {
        key: newKey,
        position: newPosition,
        uuid: Math.random().toString(36).substr(2, 9),
        type: currentBlockType,
      },
    ]);
  };

  const cycleBlockType = () => {
    setCurrentBlockType(
      (prevType) => (prevType + 1) % Object.keys(BlockTypes).length
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'b' || event.key === 'B') {
        cycleBlockType();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cycleBlockType]);

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
