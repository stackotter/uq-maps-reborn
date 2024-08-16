// Ids are indices
interface Campus {
  nodes: Node[];
  edges: Edge[];
  buildings: Building[];
}

enum NodeTag {
  ACCESSIBLE_TOILETS,
  TOILETS,
  BIKE_BOX,
  WATER_BUBBLER,
  MICROWAVE,
  DOOR,
}

enum EdgeTag {
  ELEVATOR,
  STAIRS,
  STEEP,
  FOOTPATH,
}

interface Building {
  name: string;
  number: string;
}

interface Node {
  name?: string;
  floor?: string;
  building?: number;
  latitude: number;
  longitude: number;
  tags: NodeTag[];
}

interface Edge {
  name?: string;
  tags: EdgeTag[];
  startnode: number;
  endnode: number;
}

export const uqCampus: Campus = {
  nodes: [],
  edges: [],
  buildings: [],
};
