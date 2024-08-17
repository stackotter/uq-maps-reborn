import {
  Campus,
  Node,
  Edge,
  Path,
  Instruction,
  InstructionType,
  Directions,
} from "./map-data";
import { Vec3D } from "./vec3d";
import map from "../assets/data/map.json";
import pathLib from "ngraph.path";
import createGraph from "ngraph.graph";

//let pathLib = require('ngraph.path');
//let createGraph = require('ngraph.graph');

let graph = createGraph();
let campus: Campus = map as unknown as Campus;

let i: number = 0;
for (let node of campus.nodes) {
  graph.addNode(i);
  i++;
}

for (let edge of campus.edges) {
  graph.addLink(edge.startnode, edge.endnode, { weight: edge.length });
}

let pathFinder = pathLib.aStar(graph);

// Check set equality
const EqualSets = (xs: Set<number>, ys: Set<number>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

export function FindPath(startId: number, endId: number, map: Campus): Path {
  let path = pathFinder.find(startId, endId).reverse();

  let nodes: number[] = path.map((node) => node.id as number);

  let edges: number[] = [];
  let i: number = 0;
  // we intentionally ignore the last node
  // (because there is no edge after it)
  while (i < path.length - 1) {
    //path[i].map(node => node.links)
    //		 .filter(link => )
    let startIndex: number = nodes[i];
    let currentEdges: number[] = campus.nodes[startIndex].edges;
    let goalEdge: Set<number> = new Set<number>([nodes[i], nodes[i + 1]]);
    // check if the start and end nodes of a connection match
    // the connection created by our path finder
    // (if one does then we save it to `edges: number[]`)
    for (let edgeIndex of currentEdges) {
      let edge: Edge = campus.edges[edgeIndex];
      let currentEdge: Set<number> = new Set<number>([
        edge.startnode,
        edge.endnode,
      ]);
      if (EqualSets(currentEdge, goalEdge)) {
        edges.push(edgeIndex);
      }
    }
    i++;
  }

  return { nodes, edges };
}

/*
class Vec3D() {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	FromNode(node: Node): Vec3D {
		x = Math.sin(node.latitude) * Math.cos(node.longitude);
		y = Math.sin(node.latitude) * Math.sin(node.longitude);
		z = Math.cos(node.latitude);
		return new Vec3D(x, y, z);
	}

	RelativeTo(v: Vec3D): Vec3D {
		return new Vec3D(x -v.x, y-v.y, z-v.z)
	}

	Norm(): number {
		return Math.sqrt(x*x + y*y + z*z);
	}

	AngleTo(v: Vec3D): number {
		// compute angle to another vector
		dot: number = x*v.x + y*v.y + z*v.z;
		angle: number = Math.acos(number / this.Norm() / v.Norm());
		// convert to degrees
		angle = Math.round(angle *180 / Math.pi);
		return Math.min(angle, 360-angle);
	}
}
*/

// 1. calculate angles between pairs
// 2. match tag to InstructionType for every thing
//
//
// we can "continue straight" (additive)
// every edge can have a to and a from message
// or one that goes both ways
//
// two things:
//     direction hint (ie "continue straight")
//	   landmark hint (ie "go past the stairs")
//
// door (to room): enter/exit {ROOM_NAME}
// door (to building): enter/exit {BUILDING_NAME}
// stairs: take the stairs for {NUM_FLOORS} floors
// elevator: take the elevator to floor {FLOOR_NUM}
//
// delete old info as we move past it
// (or constantly wait until a criteria is
//  met to progress in our instructions)

function ToDirections(path: Path): Directions {
  let angles: number[] = [0];

  // instruction types
  let insTypes: InstructionType[] = [];
  // ignore the first and last nodes
  let i: number = 1;
  while (i < path.nodes.length - 1) {
    let nodeA: Node = campus.nodes[path.nodes[i - 1]];
    let nodeB: Node = campus.nodes[path.nodes[i]];
    let nodeC: Node = campus.nodes[path.nodes[i + 1]];

    let edgeAB: Edge = campus.edges[path.edges[i - 1]];
    let edgeBC: Edge = campus.edges[path.edges[i]];

    //if

    // calculate the turning angle that occurs  at every junction
    // convert lat/lng to cartesian coordinates (radius=1)
    let vecA: Vec3D = Vec3D.FromNode(nodeA);
    let vecB: Vec3D = Vec3D.FromNode(nodeB);
    let vecC: Vec3D = Vec3D.FromNode(nodeC);

    let incident: Vec3D = vecB.RelativeTo(vecA);
    let reflected: Vec3D = vecB.RelativeTo(vecC);

    let angle: number = incident.AngleWith(reflected);
    // console.log(angle, "degrees");

    // map the angle to a sentence
    if (-30 <= angle && angle <= 30) {
      InstructionType.FORWARD;
    } else if (-150 <= angle && angle < -30) {
      InstructionType.LEFT;
    } else if (30 < angle && angle <= 150) {
      InstructionType.RIGHT;
    }

    i++;
  }

  angles.push(0);

  let map: Map<number, number> = new Map<number, number>();
  let instructions: Instruction[] = [];
  return { edgeMap: map, instructions: instructions };
}

let path: Path = FindPath(0, 17, map as unknown as Campus);
let directions: Directions = ToDirections(path);
// console.log(path.nodes);
// console.log(path.edges);
