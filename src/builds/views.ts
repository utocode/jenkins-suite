// import { ColorInformation, ExtensionContext, TreeItem, TreeItemCollapsibleState, Uri, window } from 'vscode';
// import { ExplorerNode } from '../explorer/views';
// import { ResourceType } from "../types/jenkins-types";
// import { Build, Builds } from "./models";

// export class BuildNode extends ExplorerNode {

//     constructor(context: ExtensionContext, protected build: Build) {
//         super(context);
//     }

//     getChildren(): ExplorerNode[] {
//         this.resetChildren();

//         return [];
//     }

//     getTreeItem(): TreeItem {
//         const item = new TreeItem(this.build.getName());
//         item.contextValue = ResourceType.build;
//         const color = this.build.getColor();
//         if (color !== undefined)
//             {item.iconPath = this.context.asAbsolutePath(this.build.getIconPath());}
//         return item;
//     }
// }

// export class BuildsNode extends ExplorerNode {

//     constructor(context: ExtensionContext, protected builds: Builds) {
//         super(context);
//     }

//     getBuilds = (): Promise<BuildNode[]> => this.builds.getBuildsList()
//         .then(builds => builds.map(view => new BuildNode(this.context, view)));

//     getChildren(): Promise<ExplorerNode[]> {
//         this.resetChildren();

//         this.children = this.getBuilds();
//         return this.children;
//     }

//     getTreeItem(): TreeItem {
//         const item = new TreeItem("Build History", TreeItemCollapsibleState.Expanded);
//         item.contextValue = ResourceType.views;
//         return item;
//     }

// }
