export enum BallColor {

    blue = "blue",
    blueAnime = "blue_anime",

    grey = "grey",
    greyAnime = "grey_anime",

    red = "red",
    redAnime = "red_anime",

    yellow = "yellow",
    yellowAnime = "yellow_anime",

    aborted = "aborted",
    abortedAnime = "aborted_anime",

    disabled = "disabled",
    disabledAnime = "disabled_anime",

    notbuilt = "notbuilt",
    notbuiltAnime = "notbuilt_anime",

}

export enum ResourceType {

    build = "jenkins:build",

    job = "jenkins:job",

    views = "jenkins:views",
    view = "jenkins:view",

    nodes = "jenkins:nodes",
    node = "jenkins:node",

    system = "jenkins:system",

}

export enum Result {

    aborted = "ABORTED",
    failure = "FAILURE",
    success = "SUCCESS",
    unstable = "UNSTABLE",
    notBuilt = "NOT_BUILT",
    start = "START"

}

export enum CrumbIssuer {
    crumbIssuer = 'hudson.security.csrf.DefaultCrumbIssuer'
}

enum ViewType {
    listView = 'hudson.model.ListView',
    myView = 'hudson.model.MyView'
}

enum ScmType {
    gitScm = 'hudson.plugins.git.GitSCM'
}

enum ProjectType {
    freeStyleProject = "hudson.model.FreeStyleProject",
    workflowJob = "org.jenkinsci.plugins.workflow.job.WorkflowJob"
}

enum ActionType {
    jobDisplayAction = 'org.jenkinsci.plugins.displayurlapi.actions.JobDisplayAction',
    viewCredentialsAction = 'com.cloudbees.plugins.credentials.ViewCredentialsAction'
}

export interface Jobs {
    _class: string
    name: string
    url: string
    color?: string
}

 export enum JobActionType {
    causeAction = 'hudson.model.CauseAction',
    parameterAction = 'hudson.model.ParametersAction'
}

export enum DefinitionPropertyType {
    parametersDefinitionProperty = 'hudson.model.ParametersDefinitionProperty'
}

export function getResultColor(resultColor: string | undefined): BallColor {
    if (!resultColor) {
        resultColor = 'NOT_BUILT';
    }

    const map: { [result: string]: BallColor; } = {};
    map[Result.success] = BallColor.blue;
    map[Result.unstable] = BallColor.yellow;
    map[Result.failure] = BallColor.red;
    map[Result.notBuilt] = BallColor.notbuilt;
    map[Result.aborted] = BallColor.aborted;
    return map[resultColor];
};
