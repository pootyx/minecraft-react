import Block, { BlockType } from "./Block";

interface WorldProps {
  blocks: BlockType[];
  handleRemoveBlock: (key: string) => void;
  handlePlaceBlock: (
    position: [number, number, number],
    normal: [number, number, number]
  ) => void;
  selectedBlock: string | null;
}

function World({
  blocks,
  handleRemoveBlock,
  handlePlaceBlock,
  selectedBlock,
}: WorldProps) {
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

export default World;