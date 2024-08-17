// Ids are indices
export interface Campus {
  nodes: Node[];
  edges: Edge[];
  buildings: Building[];
  rooms: Room[];
}

export enum NodeTag {
  ACCESSIBLE_TOILETS,
  TOILETS,
  BIKE_BOX,
  WATER_BUBBLER,
  MICROWAVE,
  DOOR,
}

export enum EdgeTag {
  ELEVATOR,
  STAIRS,
  STEEP,
  FOOTPATH,
}

export interface Building {
  name: string;
  number: string;
}

export interface Room {
  building: number;
  number: string;
  name?: string;
  latitude: number;
  longitude: number;
  edges: number[];
}

export interface Node {
  name?: string;
  room?: string;
  floor?: string;
  building?: number;
  latitude: number;
  longitude: number;
  tags: NodeTag[];
  edges: number[];
}

export interface Edge {
  name?: string;
  tags: EdgeTag[];
  startnode: number;
  endnode: number;
  length: number;
}

export const uqCampus: Campus = {
  nodes: [],
  edges: [],
  buildings: [],
};
