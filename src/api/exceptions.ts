export class JenkinsError extends Error {

    constructor(public message: string) {
        super();
    }

}

export class JenkinsConfigError extends JenkinsError {

}
