// import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
// import { ExplorerNode } from '../explorer/views';
// import { ResourceType } from "../types/jenkins-types";
// import { Computer, Computers } from '../types/model';

// export class NodeNode extends ExplorerNode {

//     constructor(context: ExtensionContext, protected node: Computer) {
//         super(context);
//     }

//     async getChildren(): Promise<ExplorerNode[]> {
//         this.resetChildren();

//         return [];
//     }

//     getTreeItem(): TreeItem {
//         const item = new TreeItem(this.node.displayName);
//         item.contextValue = ResourceType.node;
//         const icon = this.node.icon;
//         if (icon !== undefined) {
//             item.iconPath = this.context.asAbsolutePath('resources/node/' + this.node.icon);
//         }
//         return item;
//     }
// }

// export class NodesNode extends ExplorerNode {

//     constructor(context: ExtensionContext, protected nodes: Computers) {
//         super(context);
//     }

//     // getNodeNodes = (): NodeNode[] => this.nodes.getNodesList()
//     //     .map(view => new NodeNode(this.context, view));

//     getNodeNodes(): NodeNode[] {
//         return this.nodes.computer.map(view => new NodeNode(this.context, view));
//     }

//     getChildren(): ExplorerNode[] {
//         this.resetChildren();

//         this.children = this.getNodeNodes();
//         return this.children;
//     }

//     getTreeItem(): TreeItem {
//         const item = new TreeItem("Nodes", TreeItemCollapsibleState.Collapsed);
//         item.contextValue = ResourceType.nodes;
//         return item;
//     }

// }
