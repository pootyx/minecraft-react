export enum BlockTypes {
  DIRT,
  GRASS,
  STONE,
  // Add other block types as needed
}

export interface BlockType {
  key: string;
  position: [number, number, number];
  uuid: string;
  type: BlockTypes;
}
