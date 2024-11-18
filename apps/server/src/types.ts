export enum BlockTypes {
  DIRT = 0,
  GRASS = 1,
  WOOD = 2,
  STONE = 3,
  SAND = 4,
}

export interface BlockType {
  key: string;
  position: [number, number, number];
  uuid: string;
  type: BlockTypes;
}
