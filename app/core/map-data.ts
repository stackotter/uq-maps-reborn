// Ids are indices
export interface Campus {
  nodes: Node[];
  edges: Edge[];
  buildings: Building[];
  rooms: Room[];
}

// A route should always have one less edge than nodes.
export interface Route {
  nodes: Node[];
  edges: Edge[];
}

export enum NodeTag {
  ACCESSIBLE_TOILETS,
  TOILETS,
  BIKE_BOX,
  WATER_BUBBLER,
  MICROWAVE,
  DOOR,
}

export interface Building {
  name: string;
  number: string;
  latitude: number;
  longitude: number;
}

export interface Room {
  building: number;
  number: string;
  name?: string;
  latitude: number;
  longitude: number;
  nodes: number[];
}


// change room to be a number (index into the array of rooms)
// change floor to be a number (not an index, just the floor number)
export interface Node {
  name?: string;
  room?: string;
  floor?: string;
  building?: number;
  latitude: number;
  longitude: number;
  tags: string[];
  edges: number[];
}

export enum EdgeTag {
  STAIRS = "stairs", 
  ELEVATOR = "elevator",
  FOOTPATH = "footpath",
  DOOR = "door",
  NULL = "null",
}

export interface Edge {
  name?: string;
  tags: string[];
  startnode: number;
  endnode: number;
  length: number;
}

export interface Path {
  nodes: number[];
  edges: number[];
}

export enum InstructionType {
  FORWARD = "foward",
  TURN = "turn",
  LEFT = "left",
  RIGHT = "right",
  STAIRS = "stairs",
  ELEVATOR_ENTER = "enter elevator",
  ELAVATOR_EXIT = "exit elevator",
  SWIM = "swim",
  VAULT = "vault",
  FLY = "fly",
  PHASE_THROUGH_WALL = "phase through wall",
  SCALE_BUILDING = "scale the building",
  FIGHT_NEAREST_STRANGER = "fight your nearest stranger",
}

export enum Bearing {
  UP = "UP",
  DOWN = "DOWN",
  ENTER = "ENTER",
  EXIT = "EXIT",
  NULL = "NULL",
}

export interface Instruction {
  message: string;
  type: InstructionType;
}

export interface Directions {
  nodeDirectionChanges: InstructionType[]; 
  edgeMessages: string[];
}


export class Messages {
  static RoomEnter(name: string): string {
    return `enter room ${name}`;
  }
  static RoomExit(name: string): string {
    return `exit room ${name}`;
  }

  static BuildingEnter(name: string): string {
    return `enter ${name}`;
  }
  static BuildingExit(name: string): string {
    return `exit ${name}`;
  }
  
  static Stairs(bearing: Bearing, delta: number) {
    let bearingStr: string = (bearing as string).toLowerCase();
    return `take the stairs ${bearingStr} ${delta} level`
  }

  static Elevator(bearing: Bearing, floor: number) {
    let bearingStr: string = (bearing as string).toLowerCase();
    return `take the elevator ${bearingStr} to level ${floor}`;
  }
}
