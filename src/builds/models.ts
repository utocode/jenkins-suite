// import { Jenkins } from "../api/jenkins";
// import { BallColor, Result } from "../types/jenkins-types";
// ;

// export class Build {

//     constructor(public readonly build: any, private executor: Jenkins) { }

//     getName = (): string => this.build.fullDisplayName;

//     getResult = (): Result => <Result>this.build.result;

//     getColor = (): BallColor => {
//         const map: { [result: string]: BallColor; } = {};
//         map[Result.success] = BallColor.blue;
//         map[Result.unstable] = BallColor.yellow;
//         map[Result.failure] = BallColor.red;
//         map[Result.notBuilt] = BallColor.notbuilt;
//         map[Result.aborted] = BallColor.aborted;
//         return map[this.getResult()];
//     };

//     getIconPath = (): string => 'resources/job/' + this.getColor() + '.png';

// }

// export class Builds {

//     constructor(public readonly name: string, public readonly builds: any[], private executor: Jenkins) { }

//     getBuild = (name: string, buildNumber: number): Promise<Build> => this.executor.getBuild(name, buildNumber)
//         .then(build => new Build(build, this.executor));

//     getBuildsList = (): Promise<Build[]> => Promise.all(this.builds.map(build => this.getBuild(this.name, build.build.number)));

// }
