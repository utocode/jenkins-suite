import * as vscode from 'vscode';
import { DefinitionPropertyType, JobActionType } from './jenkins-types';
import { BaseAction, CauseAction, JobParamDefinition, JobProperty, ParameterAction } from './model';

export function getParameterAction(actions: BaseAction[]) {
    const param = actions.filter(it => it._class === JobActionType.parameterAction);
    return param && param.length > 0 ? (param[0] as ParameterAction).parameters : undefined;
    // return param;
}

export function getCauseAction(actions: BaseAction[]) {
    const param = actions.filter(it => it._class === JobActionType.causeAction);
    return param && param.length > 0 ? (param[0] as CauseAction).causes : undefined;
    // return param;
}

export function getJobParamDefinitions(actions: JobProperty[]): JobParamDefinition[] | undefined {
    const param = actions.filter(it => it._class === DefinitionPropertyType.parametersDefinitionProperty);
    return param && param.length > 0 ? param[0].parameterDefinitions : undefined;
    // return param;
}
