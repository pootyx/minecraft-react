import { useRef, useMemo, useEffect, useState, RefObject } from 'react';
import {
  InstancedMesh,
  Object3D,
  MeshStandardMaterial,
  BoxGeometry,
  Color,
  BufferGeometry,
  InstancedMeshEventMap,
  Material,
  NormalBufferAttributes,
} from 'three';
import { useLoader, useFrame, ThreeEvent } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { BlockType, BlockTypes } from './Block';

interface InstancedBlocksProps {
  blocks: BlockType[];
  blockType: BlockTypes;
  onBlockInteraction: (
    index: number,
    action: 'remove' | 'place' | 'up'
  ) => void;
  selectedBlock: string | null;
  currentBlockType: BlockTypes;
}

function InstancedBlocks({
  blocks,
  blockType,
  onBlockInteraction,
  selectedBlock,
  currentBlockType,
}: InstancedBlocksProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const [cracks, setCracks] = useState<{ [key: string]: number }>({});

  const texture = useLoader(
    TextureLoader,
    `/textures/${BlockTypes[blockType].toLowerCase()}.png`
  );
  const material = useMemo(
    () => new MeshStandardMaterial({ map: texture }),
    [texture]
  );
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);

  useEffect(() => {
    if (meshRef.current) {
      blocks.forEach((block, index) => {
        tempObject.position.set(...block.position);
        tempObject.updateMatrix();
        if (meshRef.current)
          meshRef.current.setMatrixAt(index, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [blocks, tempObject]);

  useFrame(() => {
    if (meshRef.current) {
      blocks.forEach((block, index) => {
        const crackLevel = cracks[block.uuid] || 0;
        const color = new Color(
          1 - crackLevel * 0.3,
          1 - crackLevel * 0.3,
          1 - crackLevel * 0.3
        );
        if (meshRef.current) meshRef.current.setColorAt(index, color);
      });
      if (meshRef.current.instanceColor)
        meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId !== undefined) {
      const block = blocks[event.instanceId];
      if (event.button === 0 && block.uuid === selectedBlock) {
        setCracks((prev) => ({
          ...prev,
          [block.uuid]: (prev[block.uuid] || 0) + 1,
        }));
        if ((cracks[block.uuid] || 0) >= 2) {
          onBlockInteraction(event.instanceId, 'remove');
        }
      } else if (event.button === 2) {
        onBlockInteraction(event.instanceId, 'place');
      }
    }
  };

  const handlePointerUp = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId !== undefined) {
      const block = blocks[event.instanceId];
      if (block.uuid === selectedBlock) {
        onBlockInteraction(event.instanceId, 'up');
        setCracks((prev) => ({
          ...prev,
          [block.uuid]: 0,
        }));
      }
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, blocks.length]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      castShadow
      receiveShadow
    />
  );
}

export default InstancedBlocks;
