export type Position = number[];
export type BoundingBox = Position[];
export interface Ship {
  position: Position;
  name: string;
  heading: number;
  id: number;
}
