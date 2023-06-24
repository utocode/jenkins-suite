import * as vscode from 'vscode';
import { ThemeIcon, Uri } from 'vscode';
import { BallColor, Jobs, Result } from "./jenkins-types";

export interface JenkinsInfo {
    mode: string
    nodeDescription: string
    nodeName: string
    description: string
    jobs: JobsModel[]
    numExecutors: number
    quietDownReason: string
    quietingDown: boolean
    slaveAgentPort: number
    url: string
    primaryView: ViewsModel
    useCrumbs: boolean
    useSecurity: boolean
    views: ViewsModel[]
}

export interface BaseModel {
    _class: string
    name: string
    url: string
}

export interface AllViewModel extends BaseModel {
    description: string
    jobs: JobsModel[]
    property: any
}

export interface ViewsModel extends BaseModel {
    description: string
}

export interface BaseJobModel extends BaseModel {
    color: BallColor.notbuilt
    buildable: boolean
    fullName: string
    fullDisplayName: string
    description?: string
    level?: number
    jobParam?: JobParamDefinition
}

export interface JobsModel extends BaseJobModel {
    healthReport: HealthReport[]
    jobDetail?: BuildsModel
    parents?: JobsModel[]
}

export interface HealthReport {
    description: string
    iconClassName: string
    iconUrl: string
    score: number
}

export interface WorkflowJobModel extends JobsModel {
}

export interface FolderModel extends JobsModel {
    // color: BallColor.notbuilt
    jobs: JobsModel[]
    views: any[]
}

export interface WorkflowMultiBranchProjectModel extends JobsModel {
    jobs: JobsModel[]
    views: any[]
}

export interface BuildsModel extends BaseJobModel {
    actions: BaseAction[]
    displayName: string
    displayNameOrNull: string
    builds: BuildStatus[]
    firstBuild: BuildStatus
    healthReport: any[]
    inQueue: boolean
    keepDependencies: boolean
    lastBuild: BuildStatus
    lastCompletedBuild: BuildStatus
    lastFailedBuild: BuildStatus
    lastStableBuild: string
    lastSuccessfulBuild: string
    lastUnstableBuild: string
    lastUnsuccessfulBuild: BuildStatus
    nextBuildNumber: number
    property: JobProperty[]
    queueItem: string
    concurrentBuild: boolean
    resumeBlocked: boolean
}

export enum JobModelType {

    freeStyleProject = 'hudson.model.FreeStyleProject',
    workflowJob = 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
    folder = 'com.cloudbees.hudson.plugins.folder.Folder',
    workflowMultiBranchProject = 'org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject'

}

export interface BaseAction {
    _class: string
}

export interface ParameterAction extends BaseAction {
    parameters: JobParameter[]
}

export interface CauseAction extends BaseAction {
    causes: CauseParameter[]
}

export interface JobParameter {
    _class: string
    name: string
    value: string
}

export interface CauseParameter {
    _class: string
    shortDescription: string
    userId: string
    userName: string
}

export interface JobProperty {
    _class: string
    parameterDefinitions: JobParamDefinition[]
}

export interface JobParamDefinition {
    _class: string
    defaultParameterValue: {
        _class: string
        name: string
        value: string
    }
    description: string
    name: string
    type: string
}

export interface BuildStatus {
    _class: string
    number: number
    url: string
}

export interface BuildDetailStatus {
    _class: string
    actions: BaseAction[]
    artifacts: any[]
    building: boolean
    description: string
    displayName: string
    duration: number
    estimatedDuration: number
    executor: any
    fullDisplayName: string
    id: string
    inProgress: boolean
    nextBuild: number
    previousBuild: number
    keepLog: boolean
    number: number
    queueID: number
    result: string
    timestamp: number
    url: string
    builtOn: string
    changeSet: any
    culprits: any[]
}


export interface CrumbIssuer {
    _class: string
    crumb: string
    crumbRequestField: string
}


export interface Computers {
    _class: string
    busyExecutors: number
    computer: Computer[]
    displayName: string
    totalExecutors: number
}


export interface Computer {
    _class: string
    actions: any
    assignedLabels: any[]
    description: string
    displayName: string
    executors: any[]
    icon: string
    iconclassname: string
    idle: boolean
    jnlpAgent: boolean
    launchSupported: boolean
    loadStatistics: any
    manualLaunchAllowed: boolean
    monitorData: any
    numExecutors: number
    offline: boolean
    offlineCause: string
    offlineCauseReason: string
    oneOffExecutors: any[]
    temporarilyOffline: boolean
}

export interface WsTalkMessage {
    job: string
    number: number
    iconColor: string
    url: string
    builds: any
    causeAction: CauseAction
    parameterAction?: ParameterAction
    changeLogSet: any
    status: Result
    result: Result
    commitId: string
    author: string
    duration: string
    timestamp: number
    createTime: string
}

export interface ModelQuickPick<T> extends vscode.QuickPickItem {
    model?: T
}
