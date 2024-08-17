import { Campus, Node } from "./map-data.ts"
import "mapping_

class Dijkstra {

    campus: Campus;
    nodeWeights: Array<number>;
    constructor(campus: Campus) {
        this.campus = campus;
        //this.nodes = {};
        this.nodeWeights = let arr = new Array<number>();
    }

    /*
    addNode(node: Node): void {
        this.nodes[node.name] = node;
    }
    */

    findPointsOfShortestWay(start: number, finish: number, weight: number): number[] {

        let nextNode: number = finish;
        let arrayWithNode: number[] = [];
        while (nextNode !== start) {

            let minWeight: number = Number.MAX_VALUE;
            let minNodeIndex: number = -1;
            
            let i: number = 0;
            //for (let i of this.campus.nodes[nextNode]) {
            while (i < this.campus.nodes.length) {
                if (this.nodeWeights[i] + this.nodeWeights[nextNode] < minWeight) {
                    minWeight = this.nodesWeights[i];
                    minNodeIndex = nextNode;
                }
                i++;
            }
            arrayWithNode.push(minNodeIndex);
            nextNode = minNodeIndex;
        }
        return arrayWithNode;
    }


    //findShortestWay(start: string, finish: string): string[] {
    findShortestWay(start: number, finish: number): number[] {
        
        let nodes: any = {};
        //let visitedNode: number[] = [];
        
        // at this point nodes and this.nodes pair perfectly
        let i: number = 0;
        while (i < this.campus.nodes.length) {
            nodes[i], this.nodeWeights[i] = Number.MAX_VALUE;
            i++;
        }
        nodes[start], this.nodesWeights[start] = 0;

        while (nodes.length !== 0) {
            let sortedVisitedByWeight: number[] = Object.keys(nodes).sort((a, b) => this.nodeWeights[a] - this.nodeWeights[b]);
            let currentNodeIndex: number = sortedVisitedByWeight[0];
            let currentNode: Node = this.campus.nodes[currentNodeIndex];
            for (let j of currentNode.edges) {
                let jStart: number = this.campus.edges[j].startnode;
                let jEnd: number = this.campus.edges[j].endnode;
                // determine whether `j` is the edge's start or end node
                let jNodeIndex: number = jStart == currentNodeIndex ? jEnd : jStart;
                //let jNode: number = this.campus.nodes[jNodeIndex];

                const calculateWeight: number = this.nodeWeights[currentNodeIndex] + this.nodeWeights[jNodeIndex];
                if (calculateWeight < this.campus.nodes[jNodeIndex].weight) {
                    this.nodesWeights[jNodeIndex]= calculateWeight;
                }
            }
            delete nodes[sortedVisitedByWeight[0]];
        }
        const finishWeight: number = this.nodesWeights[finish];
        let arrayWithNode: number[] = this.findPointsOfShortestWay(start, finish, finishWeight).reverse();
        arrayWithNode.push(finish, finishWeight.toString());
        return arrayWithNode;
    }

}

/*
let dijkstra = new Dijkstra();
dijkstra.addNode(new Node("A", [{ nameOfNode: "C", weight: 3 }, { nameOfNode: "E", weight: 7 }, { nameOfNode: "B", weight: 4 }], 1));
dijkstra.addNode(new Node("B", [{ nameOfNode: "A", weight: 4 }, { nameOfNode: "C", weight: 6 }, { nameOfNode: "D", weight: 5 }], 1));
dijkstra.addNode(new Node("C", [{ nameOfNode: "A", weight: 3 }, { nameOfNode: "B", weight: 6 }, { nameOfNode: "E", weight: 8 }, { nameOfNode: "D", weight: 11 }], 1));
dijkstra.addNode(new Node("D", [{ nameOfNode: "B", weight: 5 }, { nameOfNode: "C", weight: 11 }, { nameOfNode: "E", weight: 2 }, { nameOfNode: "F", weight: 2 }], 1));
dijkstra.addNode(new Node("E", [{ nameOfNode: "A", weight: 7 }, { nameOfNode: "C", weight: 8 }, { nameOfNode: "D", weight: 2 }, { nameOfNode: "G", weight: 5 }], 1));
dijkstra.addNode(new Node("F", [{ nameOfNode: "D", weight: 2 }, { nameOfNode: "G", weight: 3 }], 1));
dijkstra.addNode(new Node("G", [{ nameOfNode: "D", weight: 10 }, { nameOfNode: "E", weight: 5 }, { nameOfNode: "F", weight: 3 }], 1));
console.log(dijkstra.findShortestWay("A", "F"));
*/



