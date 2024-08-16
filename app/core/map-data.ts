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
  building?: number;
  latitude: number;
  longitude: number;
  tags: string[];
}

interface Edge {
  name?: string;
  tags: string[];
  startnode: number;
  endnode: number;
}
