import { useMemo } from 'react';
import { BlockType, BlockTypes } from './Block';
import InstancedBlocks from './InstancedBlocks';

interface WorldProps {
  blocks: BlockType[];
  handleRemoveBlock: (key: string) => void;
  handlePlaceBlock: (
    position: [number, number, number],
    normal: [number, number, number]
  ) => void;
  selectedBlock: string | null;
  currentBlockType: BlockTypes;
}

function World({
  blocks,
  handleRemoveBlock,
  handlePlaceBlock,
  selectedBlock,
  currentBlockType,
}: WorldProps) {
  const groupedBlocks = useMemo(() => {
    const groups: { [key in BlockTypes]: BlockType[] } = {
      [BlockTypes.DIRT]: [],
      [BlockTypes.GRASS]: [],
      [BlockTypes.WOOD]: [],
      [BlockTypes.STONE]: [],
      [BlockTypes.SAND]: [],
    };
    for (const block of blocks) {
      groups[block.type].push(block);
    }
    return groups;
  }, [blocks]);

  const handleBlockInteraction = (
    blockType: BlockTypes,
    index: number,
    action: 'remove' | 'place' | 'up'
  ) => {
    const block = groupedBlocks[blockType][index];
    if (action === 'remove') {
      handleRemoveBlock(block.key);
    } else if (action === 'place') {
      handlePlaceBlock(block.position, [0, 1, 0]);
    } else if (action === 'up') {
      // Do nothing
    }
  };

  return (
    <>
      {Object.entries(groupedBlocks).map(([type, blockGroup]) => (
        <InstancedBlocks
          key={type}
          blocks={blockGroup}
          blockType={Number(type) as BlockTypes}
          onBlockInteraction={(index, action) =>
            handleBlockInteraction(Number(type) as BlockTypes, index, action)
          }
          selectedBlock={selectedBlock}
          currentBlockType={currentBlockType}
        />
      ))}
    </>
  );
}

export default World;
