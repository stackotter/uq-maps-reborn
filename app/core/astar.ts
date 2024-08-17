import { Node } from "./map-data.ts"


class GraphChildNode {
    nameOfNode: string;
    weight: number;
}

class GraphNode {
    name: string;
    nodes: NodeNode[];
    weight: number;

    constructor(theName: string, theNodes: NodeNode[], theWeight: number) {
        this.name = theName;
        this.nodes = theNodes;
        this.weight = theWeight;
    }
}

class Dijkstra {

    nodes: any;
    constructor() {
        this.nodes = {};
    }

    addNode(node: Node): void {
        this.nodes[node.name] = node;
    }

    findPointsOfShortestWay(start: string, finish: string, weight: number): string[] {

        let nextNode: string = finish;
        let arrayWithNode: string[] = [];
        while (nextNode !== start) {

            let minWeigth: number = Number.MAX_VALUE;
            let minNode: string = "";
            for (let i of this.nodes[nextNode].nodes) {
                if (i.weight + this.nodes[i.nameOfNode].weight < minWeigth) {
                    minWeigth = this.nodes[i.nameOfNode].weight;
                    minNode = i.nameOfNode;
                }
            }
            arrayWithNode.push(minNode);
            nextNode = minNode;
        }
        return arrayWithNode;
    }


    findShortestWay(start: string, finish: string): string[] {

        let nodes: any = {};
        let visitedNode: string[] = [];

        for (let i in this.nodes) {
            if (this.nodes[i].name === start) {
                this.nodes[i].weight = 0;

            } else {
                this.nodes[i].weight = Number.MAX_VALUE;
            }
            nodes[this.nodes[i].name] = this.nodes[i].weight;
        }

        while (Object.keys(nodes).length !== 0) {
            let sortedVisitedByWeight: string[] = Object.keys(nodes).sort((a, b) => this.nodes[a].weight - this.nodes[b].weight);
            let currentNode: Node = this.nodes[sortedVisitedByWeight[0]];
            for (let j of currentNode.nodes) {
                const calculateWeight: number = currentNode.weight + j.weight;
                if (calculateWeight < this.nodes[j.nameOfNode].weight) {
                    this.nodes[j.nameOfNode].weight = calculateWeight;
                }
            }
            delete nodes[sortedVisitedByWeight[0]];
        }
        const finishWeight: number = this.nodes[finish].weight;
        let arrayWithNode: string[] = this.findPointsOfShortestWay(start, finish, finishWeight).reverse();
        arrayWithNode.push(finish, finishWeight.toString());
        return arrayWithNode;
    }

}

let dijkstra = new Dijkstra();
dijkstra.addNode(new Node("A", [{ nameOfNode: "C", weight: 3 }, { nameOfNode: "E", weight: 7 }, { nameOfNode: "B", weight: 4 }], 1));
dijkstra.addNode(new Node("B", [{ nameOfNode: "A", weight: 4 }, { nameOfNode: "C", weight: 6 }, { nameOfNode: "D", weight: 5 }], 1));
dijkstra.addNode(new Node("C", [{ nameOfNode: "A", weight: 3 }, { nameOfNode: "B", weight: 6 }, { nameOfNode: "E", weight: 8 }, { nameOfNode: "D", weight: 11 }], 1));
dijkstra.addNode(new Node("D", [{ nameOfNode: "B", weight: 5 }, { nameOfNode: "C", weight: 11 }, { nameOfNode: "E", weight: 2 }, { nameOfNode: "F", weight: 2 }], 1));
dijkstra.addNode(new Node("E", [{ nameOfNode: "A", weight: 7 }, { nameOfNode: "C", weight: 8 }, { nameOfNode: "D", weight: 2 }, { nameOfNode: "G", weight: 5 }], 1));
dijkstra.addNode(new Node("F", [{ nameOfNode: "D", weight: 2 }, { nameOfNode: "G", weight: 3 }], 1));
dijkstra.addNode(new Node("G", [{ nameOfNode: "D", weight: 10 }, { nameOfNode: "E", weight: 5 }, { nameOfNode: "F", weight: 3 }], 1));
console.log(dijkstra.findShortestWay("A", "F"));

