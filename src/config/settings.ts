import Ajv, * as ajv from 'ajv';
import _ from 'lodash';
import * as vscode from "vscode";
import { EXTENSION_NAME } from '../constants';
import logger from '../utils/logger';


export interface JenkinsProperty {
    url: string;
    description: string;
    username: string;
    token: string;
    ssh?: SshServer;
    wstalk?: WsTalk;
}

export interface SshServer {
    enabled: boolean;
    address: string;
    port: number;
    username: string;
    externalPath: string;
    externalArg: string;
    extraArg?: string;
    shellPath: string;
}

export interface WsTalk {
    enabled: boolean;
    url: string;
    description?: string;
}

export interface JenkinsServer extends JenkinsProperty {
    name: string;
}

export default class JenkinsConfiguration {

    private static readonly extensionName = "utocode.jenkinssuite";

    private static readonly compiledSchemas = new Map<string, ajv.ValidateFunction>();

    private static readonly rootName = EXTENSION_NAME;

    private static config<T>(name: string): T | undefined {
        let settings = vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<T>(name);
        if (settings === undefined) {
            return undefined;
        }

        return _.merge({}, settings.globalValue, settings.workspaceValue, settings.workspaceFolderValue);
    }

    private static validate(obj: any, property: "servers") {
        try {
            if (!this.compiledSchemas.has(property)) {
                let ext = vscode.extensions.getExtension(this.extensionName);
                if (!ext) {
                    logger.error(`Could not find configuration [${this.extensionName}]`);
                    return;
                }

                let schema = ext.packageJSON.contributes.configuration?.properties?.[`jenkinssuite.${property}`];
                if (!schema) {
                    logger.error(`Could not find configuration schema [jenkinssuite.${property}]`);
                    return;
                }

                this.compiledSchemas.set(property, new Ajv().compile(schema));
            }

            let validator = this.compiledSchemas.get(property) as ajv.ValidateFunction;
            let validationResult = validator(obj);
            if (!validationResult) {
                let errorMsg = "There is an Error in Configuration: Please see Output window\n";
                errorMsg += (validator.errors as ajv.ErrorObject[]).map((err: any) => {
                    return `In jenkins.${property}.${err.dataPath}: ${err.message}`;
                }).join("\n");

                logger.error(errorMsg);
                throw new Error("There is an Error in Configuration: Please see Output window");
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    public static getProperty(key: string): string | undefined {
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<string>(key);
    }

    public static getPropertyAsBoolean(key: string): boolean {
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<boolean>(key) ?? false;
    }

    public static get primary(): string {
        const primaryKey = 'server.primary';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<string>(primaryKey)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<string>(primaryKey)?.defaultValue
            ??
            '';
    }

    public static set primary(name: string) {
        const primaryKey = 'server.primary';
        vscode.workspace.getConfiguration().update(JenkinsConfiguration.rootName + '.' + primaryKey, name, vscode.ConfigurationTarget.Global);
    }

    public static get categorizedEnabled(): boolean {
        const key = 'plugin.categorized.enabled';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<boolean>(key)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<boolean>(key)?.defaultValue
            ??
            false;
    }

    public static get createSnippetView(): string {
        const key = 'snippet.create-view';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<string>(key)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<string>(key)?.defaultValue
            ??
            '';
    }

    public static get createSnippetFolder(): string {
        const key = 'snippet.create-folder';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<string>(key)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<string>(key)?.defaultValue
            ??
            'c_folder';
    }

    public static get buildDelay(): number {
        const key = 'build.delay';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<number>(key)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<number>(key)?.defaultValue
            ??
            3;
    }

    public static get limitBuilds(): number {
        const key = 'limit.builds';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<number>(key)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<number>(key)?.defaultValue
            ??
            15;
    }

    public static get limitHistory(): number {
        const key = 'limit.history';
        return vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).get<number>(key)
            ??
            vscode.workspace.getConfiguration(JenkinsConfiguration.rootName).inspect<number>(key)?.defaultValue
            ??
            15;
    }

    public static get servers(): Map<string, JenkinsServer> {
        let server = this.config<{ [name: string]: JenkinsProperty }>("servers");
        if (server === undefined) {
            return new Map();
        }

        this.validate(server, "servers"); // occur exception
        return new Map(Object.entries(server).map(([name, serverInfo]): [string, JenkinsServer] => [
            name, {
                name: name,
                ...serverInfo
            }
        ]));
    }

}
