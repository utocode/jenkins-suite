// import { Jenkins } from "../api/jenkins";
// import { Computer, Computers } from "../types/model";

// export class Node {

//     constructor(public readonly node: any, private executor: Jenkins) { }

//     getName = (): string => this.node.displayName;

//     getIcon = (): string => this.node.icon;

//     getIconPath = (): string => 'resources/node/' + this.getIcon();

// }

// export class Nodes1 {

//     constructor(public readonly nodes: any, private executor: Jenkins) { }

//     getNodesList = (): Node[] => this.nodes.map((node: any) => new Node(node, this.executor));

// }


// export class Nodes {

//     constructor(public readonly nodes: Computers, private executor: Jenkins) { }

//     getNodesList = (): Node[] => this.nodes.computer.map((node: Computer) => new Node(node, this.executor));

// }
