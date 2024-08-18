import {
  Campus,
  Node,
  Edge,
  EdgeTag,
  Path,
  Instruction,
  InstructionType,
  Directions,
  Messages,
  Bearing,
  navData,
} from "./map-data";
import { Vec3D } from "./vec3d";
import map from "../assets/data/map.json";
import pathLib from "ngraph.path";
import createGraph from "ngraph.graph";

let graph = createGraph();
let accessibleGraph = createGraph();
let campus: Campus = map as unknown as Campus;

let temp_i: number = 0;
for (let node of campus.nodes) {
  graph.addNode(temp_i);
  accessibleGraph.addNode(temp_i);
  temp_i++;
}

for (let edge of campus.edges) {
  if (edge.tags.includes("elevator")) {
    graph.addLink(edge.startnode, edge.endnode, { weight: 2000000 });
    continue;
  }
  graph.addLink(edge.startnode, edge.endnode, { weight: edge.length });
}

for (let edge of campus.edges) {
  if (edge.tags.includes("elevator")) {
    accessibleGraph.addLink(edge.startnode, edge.endnode, { weight: 75 });
  } else if (!edge.tags.includes("stairs")) {
    accessibleGraph.addLink(edge.startnode, edge.endnode, {
      weight: edge.length,
    });
  }
}

let pathFinder = pathLib.aStar(graph);
let accessiblePathFinder = pathLib.aStar(accessibleGraph);

// Check set equality
const EqualSets = (xs: Set<number>, ys: Set<number>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

export function FindPath(
  startId: number,
  endId: number,
  map: Campus,
  accessible: boolean = false
): Path {
  let path = accessible
    ? accessiblePathFinder.find(startId, endId).reverse()
    : pathFinder.find(startId, endId).reverse();

  let nodes: number[] = path.map((node) => node.id as number);

  let edges: number[] = [];
  let i: number = 0;
  // we intentionally ignore the last node
  // (because there is no edge after it)
  while (i < path.length - 1) {
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
//
// Detecting entry/exiting buildings
// if one node as a building associate but
// the other doesnt (or vice-versa)
//
// So far we need to:
//  detect change in building (node +1 look-ahead)
//  combine consequtive stair and elevator instructions

// if elevator before IGNORE (make exception and hardcore checking start)
// if elevator after "take the elevator"
// if elavator before "exit the elevator"

function isDigit(c: string | null): boolean {
  if (c == null) return false;
  return c >= "0" && c <= "9";
}

function getBearing(nodeA: Node, nodeB: Node): Bearing {
  let floorA: string = nodeA?.floor ?? "0";
  let floorB: string = nodeB?.floor ?? "0";
  let floorChange: number = parseInt(floorB) - parseInt(floorA);
  if (floorChange > 0) {
    return Bearing.UP;
  } else if (floorChange < 0) {
    return Bearing.DOWN;
  }
  return Bearing.NULL;
}

function getDoorBearing(nodeA: Node, nodeB: Node): Bearing {
  if (nodeA.room !== nodeB.room) {
    if (nodeA.room == null || nodeA.room == "") {
      return Bearing.ENTER;
    }
    return Bearing.EXIT;
  }
  return Bearing.NULL;
}

function clampDegrees(degrees: number) {
  let q: number = Math.floor(degrees / 360);
  let angle = degrees - q * 360;
  return angle > 180 ? angle - 360 : angle;
}

export function ToDirections(path: Path): navData[] {
  // raw directions (angles made a little nicer)
  let rawDirs: InstructionType[] = [InstructionType.BEGIN];
  // ignore the first and last nodes
  let i: number = 1;
  while (i < path.nodes.length - 1) {
    let nodeA: Node = campus.nodes[path.nodes[i - 1]];
    let nodeB: Node = campus.nodes[path.nodes[i]];
    let nodeC: Node = campus.nodes[path.nodes[i + 1]];

    let edgeAB: Edge = campus.edges[path.edges[i - 1]];
    let edgeBC: Edge = campus.edges[path.edges[i]];
    let edgeABBearing =
      edgeAB.startnode === path.nodes[i - 1]
        ? edgeAB.bearing_degrees
        : edgeAB.bearing_degrees + 180;
    let edgeBCBearing =
      edgeBC.startnode === path.nodes[i]
        ? edgeBC.bearing_degrees
        : edgeBC.bearing_degrees + 180;

    let angle: number = clampDegrees(edgeABBearing - edgeBCBearing);

    // map the angle to a sentence
    if (path.nodes[i] == 11 && path.nodes[i - 1] == 22) {
      rawDirs.push(InstructionType.RIGHT);
    } else {
      if (-30 <= angle && angle <= 30) {
        rawDirs.push(InstructionType.FORWARD);
      } else if (angle > 30) {
        rawDirs.push(InstructionType.RIGHT);
      } else if (angle <= -30) {
        rawDirs.push(InstructionType.LEFT);
      } else {
        rawDirs.push(InstructionType.TURN);
      }
    }

    // end with a "straight ahead"
    //rawDirs.push(InstructionType.FORWARD);
    i++;
  }
  //rawDirs.push(InstructionType.FORWARD);

  // our last loop got data on nodes
  // this loop gets data on our edges
  let edgeMessages: string[] = [];
  i = 0; // recent our index
  while (i < path.edges.length) {
    let nodeA: Node = campus.nodes[path.nodes[i]];
    let nodeB: Node = campus.nodes[path.nodes[i + 1]];

    let edge: Edge = campus.edges[path.edges[i]];

    let nextEdgeMessage: string = "";
    if (edge.tags.includes(EdgeTag.STAIRS as string)) {
      let bearing = getBearing(nodeA, nodeB);
      nextEdgeMessage = Messages.Stairs(bearing, 1);
      rawDirs[i] =
        bearing == Bearing.UP
          ? InstructionType.UP_ONE_FLIGHT
          : InstructionType.DOWN_ONE_FLIGHT;
    } else if (edge.tags.includes(EdgeTag.ELEVATOR as string)) {
      let bearing = getBearing(nodeA, nodeB);
      nextEdgeMessage = Messages.Elevator(getBearing(nodeA, nodeB), 1);
      let level = nodeB.floor ?? "unknown";
      rawDirs[i] = (
        bearing === Bearing.UP
          ? `Up to level ${level}`
          : `Down to level ${level}`
      ) as any;
    } else if (
      edge.tags.includes(EdgeTag.DOOR as string) ||
      edge.tags.includes(EdgeTag.SLIDING as string)
    ) {
      // first check if the door is to a room)
      //let buildingNumA: int = nodeA?.building ? -1
      let buildingA: string =
        nodeA.building !== null ? nodeA.building!.toString() : "";
      let buildingB: string =
        nodeB.building !== null ? nodeB.building!.toString() : "";
      if (buildingA == "" && buildingB !== "") {
        nextEdgeMessage = Messages.BuildingEnter(buildingB);
      }
      if (buildingA !== "" && buildingB == "") {
        nextEdgeMessage = Messages.BuildingExit(buildingA);
      }

      let doorBearing: Bearing = getDoorBearing(nodeA, nodeB);
      if (doorBearing == Bearing.ENTER) {
        nextEdgeMessage = Messages.RoomEnter(nodeB?.room ?? "");
      } else if (doorBearing == Bearing.EXIT) {
        nextEdgeMessage = Messages.RoomExit(nodeA?.room ?? "");
      }
    }
    edgeMessages.push(nextEdgeMessage);
    i++;
  }

  // /// DIS IS WHERE EMILE IS WORKING RN
  // if (count != 0) {
  //   if (countType == EdgeTag.STAIRS) {
  //     edgeMessages.push(Messages.Stairs(countBearing, count));
  //   } else if (countType == EdgeTag.ELEVATOR) {
  //     //let floorNum: number = nodeB.floor !== null ? parseInt(nodeB.floor!) : -1;
  //     let goalFloor: string | null | undefined =
  //       campus.nodes[path.nodes[path.nodes.length - 1]].floor!;
  //     edgeMessages.push(
  //       Messages.Elevator(
  //         countBearing,
  //         goalFloor !== null && goalFloor !== undefined
  //           ? parseInt(goalFloor)
  //           : 100
  //       )
  //     );
  //   }

  //   count = 0;
  //   countType = EdgeTag.NULL;
  //   countBearing = Bearing.NULL;
  // }

  rawDirs.push(InstructionType.EEPY);
  rawDirs.push(InstructionType.EEPY);
  let j: number = 0;
  //let messages: string[] = [edgeMessages[0]];
  let data: navData[] = [];
  while (j < edgeMessages.length) {
    let message: string = edgeMessages[j];
    data.push(new navData(rawDirs[j], message));
    j++;
  }
  data.push(navData.Arrived());
  //guideMessage[j]
  //return { nodeDirectionChanges: rawDirs, edgeMessages: edgeMessages };
  return data;
}

let path: Path = FindPath(1, 2, map as unknown as Campus, false);
let directions: navData[] = ToDirections(path);
//console.log(path.nodes);
//console.log(path.edges);
//console.log(directions.nodeDirectionChanges);
//console.log(directions.edgeMessages);

//console.log(directions.nodeDirectionChanges.length);
//console.log(directions.edgeMessages.length);

// console.log(path);
// console.log(path.nodes.length);
// console.log(directions.length);

let j: number = 0;
let guideMessage: string = "";
// console.log(directions);
console.log(path);
console.log(path.nodes.length);
console.log(directions.length);
console.log(directions);

//let j: number = 0;
//let guideMessage: string = "";
/*
while (j < directions.edgeMessages.length) {
  console.log("go", directions.nodeDirectionChanges[j]);
  guideMessage = directions.edgeMessages[j];
  if (guideMessage !== "" && guideMessage !== null) {
    console.log("guide:", guideMessage);
  }
  j++;
}
*/
