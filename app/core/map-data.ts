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
  edges: number[];
}

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
  TURN_AROUND,
  LEFT,
  RIGHT,
  STAIRS,
  ELEVATOR,
  SWIM,
  JUMP,
  FLY,
  PHASE_THROUGH_WALL,
  SCALE_BUILDING,
  FIGHT_NEAREST_STRANGER,
}

export interface Instruction {
  message: string;
  type: InstructionType;
}

export interface Directions {
  edgeMap: Map<number, number>;
  instructions: Instruction[];
}

/*
export class Vec3D {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static FromNode(node: Node): Vec3D {
        let x = Math.sin(node.latitude) * Math.cos(node.longitude);
        let y = Math.sin(node.latitude) * Math.sin(node.longitude);
        let z = Math.cos(node.latitude);
        return new Vec3D(x, y, z);
    }

    RelativeTo(v: Vec3D): Vec3D {
        return new Vec3D(this.x - v.x, 
                         this.y - v.y, 
                         this.z - v.z);
    }

    Norm(): number {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    AngleWith(v: Vec3D): number {
        // compute angle to another vector
        let dot: number = this.x*v.x + this.y*v.y + this.z*v.z;
        let angle: number = Math.acos(dot / this.Norm() / v.Norm());
        // convert to degrees
        angle = Math.round(angle * 180 / Math.PI);
        //return Math.min(angle, 360-angle);
        return angle - 180
    }
}
*/
