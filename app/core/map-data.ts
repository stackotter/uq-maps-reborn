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
  bearing_degrees: number;
}

export interface Path {
  nodes: number[];
  edges: number[];
}

export enum InstructionType {
  FORWARD = "Continue straight",
  TURN = "Turn around",
  LEFT = "Turn left",
  RIGHT = "Turn right",
  STAIRS = "!!!!STAIRS!!!!",
  ELEVATOR_ENTER = "Enter the elevator",
  ELEVATOR_EXIT = "Exit the elevator",
  SWIM = "Turn to swim",
  VAULT = "Politely vault",
  FLY = "Attempt to fly",
  PHASE_THROUGH_WALL = "Phase through wall",
  SCALE_BUILDING = "Scale the building",
  FIGHT_NEAREST_STRANGER = "Fight your nearest stranger",
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
    return `take the stairs ${bearingStr} ${delta} level`;
  }

  static Elevator(bearing: Bearing, floor: number) {
    let bearingStr: string = (bearing as string).toLowerCase();
    return `take the elevator ${bearingStr} to level ${floor}`;
  }
}


export class navData {
  title: string;
  message: string;
  icon: string;

  constructor(title: string, dir: InstructionType) {
    this.title = title;
    this.message = dir as unknown as string;
    this.icon = "straight";
    if (dir == InstructionType.LEFT) {
      this.icon = "turn_left";
    }
    else if (dir == InstructionType.RIGHT) {
      this.icon = "turn_right";
    }
    else if (dir == InstructionType.STAIRS) {
      this.icon = "stairs_2";
    }
  }
  
  // Congrats!
  static Arrived(): navData {
    let data: navData = new navData("", InstructionType.FORWARD); 
    data.title = "You have arrived";
    data.message = "^_^";
    data.icon = "flag_2"
    return data
  }
}
