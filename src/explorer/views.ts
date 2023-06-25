// import { Command, Disposable, ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';

// export abstract class BaseExplorerNode extends Disposable {

//     protected children: any;
//     protected disposable: Disposable | undefined;

//     constructor(public readonly context: ExtensionContext) {
//         super(() => this.dispose());
//     }

//     dispose() {
//         if (this.disposable !== undefined) {
//             this.disposable.dispose();
//             this.disposable = undefined;
//         }

//         this.resetChildren();
//     }

//     abstract getChildren(): BaseExplorerNode[] | Promise<BaseExplorerNode[]>;
//     abstract getTreeItem(): TreeItem | Promise<TreeItem>;
//     abstract handleError(err: Error): BaseExplorerNode[] | Promise<BaseExplorerNode[]>;

//     getCommand(): Command | undefined {
//         return undefined;
//     }

//     resetChildren() {
//         if (this.children !== undefined) {
//             this.children.forEach((c: { dispose: () => any; }) => c.dispose());
//             this.children = undefined;
//         }
//     }
// }

// export class MessageNode extends BaseExplorerNode {

//     constructor(public readonly context: ExtensionContext, private readonly message: string) {
//         super(context);
//     }

//     getChildren(): ExplorerNode[] | Promise<ExplorerNode[]> {
//         return [];
//     }

//     getTreeItem(): TreeItem | Promise<TreeItem> {
//         const item = new TreeItem(this.message, TreeItemCollapsibleState.None);
//         return item;
//     }

//     handleError(err: Error): ExplorerNode[] | Promise<ExplorerNode[]> {
//         return [];
//     }

// }

// export abstract class ExplorerNode extends BaseExplorerNode {

//     protected children: ExplorerNode[] | Promise<ExplorerNode[]> | undefined;

//     handleError(err: Error): MessageNode[] {
//         return [new MessageNode(this.context, 'unexpected error')];
//     }

// }
