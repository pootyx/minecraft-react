import { Physics } from '@react-three/cannon';
import { PointerLockControls, Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { BlockType, BlockTypes } from './Components/Block';
import Character from './Components/Character';
import RaycastSelector from './Components/RaycastSelector';
import World from './Components/World';
import { Perf } from 'r3f-perf';

function Minecraft() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [currentBlockType, setCurrentBlockType] = useState<BlockTypes>(
    BlockTypes.DIRT
  );

  useEffect(() => {
    const initialBlocks: BlockType[] = [];
    const size = 100;
    const depth = 1;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        for (let y = 0; y < depth; y++) {
          let blockType: BlockTypes;
          if (y === depth - 1) {
            blockType = BlockTypes.GRASS;
          } else if (y > depth - 4) {
            blockType = BlockTypes.DIRT;
          } else {
            blockType = BlockTypes.STONE;
          }
          initialBlocks.push({
            key: `${x}-${y}-${z}`,
            position: [x, y, z],
            uuid: Math.random().toString(36).substr(2, 9),
            type: blockType,
          });
        }
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
      <Perf position="top-left" />
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
          currentBlockType={currentBlockType}
        />
        <Character blocks={blocks} />
        <RaycastSelector setSelectedBlock={setSelectedBlock} />
      </Physics>
    </Canvas>
  );
}
export default Minecraft;
