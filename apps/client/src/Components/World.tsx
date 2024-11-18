import { useMemo } from "react";
import { Block, BlockTypes } from "./Block";
import InstancedBlocks from "./InstancedBlocks";

type WorldProps = {
  blocks: Block[];
};

function World({ blocks }: WorldProps) {
  const groupedBlocks = useMemo(() => {
    const groups: { [key in BlockTypes]: Block[] } = {
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

  return (
    <>
      {Object.entries(groupedBlocks).map(([type, blockGroup]) => (
        <InstancedBlocks
          key={type}
          blocks={blockGroup}
          blockType={Number(type) as BlockTypes}
        />
      ))}
    </>
  );
}

export default World;
