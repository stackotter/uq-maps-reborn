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

export enum EdgeTag {
  ELEVATOR,
  STAIRS,
  STEEP,
  FOOTPATH,
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
  FORWARD,
  TURN,
  LEFT,
  RIGHT,
  STAIRS,
  ELEVATOR_ENTER,
  ELAVATOR_EXIT,
  SWIM,
  JUMP,
  FLY,
  PHASE_THROUGH_WALL,
  SCALE_BUILDING,
  FIGHT_NEAREST_STRANGER,
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
  edgeMap: Map<number, number>;
  nodeDirectionChanges: InstructionType[]; 
  edgeMessages: string[];
  //instructions: Instruction[];
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
    return `take the stairs ${bearingStr} ${delta} levels`
  }

  static Elevator(bearing: Bearing, floor: number) {
    let bearingStr: string = (bearing as string).toLowerCase();
    return `take the elevator ${bearingStr} to level ${floor}`;
  }
}
