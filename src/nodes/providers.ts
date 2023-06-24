// import { ExtensionContext, TreeDataProvider, TreeItem, window } from "vscode";
// import { BaseExplorerNode } from "../explorer/views";
// import { NodesNode } from "./views";

// export class NodesProvider implements TreeDataProvider<BaseExplorerNode> {

//     private _loading: Promise<void> | undefined;

//     constructor(protected context: ExtensionContext, protected node: Promise<NodesNode>) { }

//     async getChildren(node?: BaseExplorerNode): Promise<BaseExplorerNode[]> {
//         if (this._loading !== undefined) {
//             await this._loading;
//             this._loading = undefined;
//         }

//         if (node === undefined) {node = await this.node;}

//         try {
//             return await node.getChildren();
//         } catch (err: any) {
//             window.showErrorMessage("Jenkins Error: " + err.message);
//             return node.handleError(err);
//         }
//     }

//     async getTreeItem(node: BaseExplorerNode): Promise<TreeItem> {
//         return node.getTreeItem();
//     }

// }
