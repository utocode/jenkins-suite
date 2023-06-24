import { JobsModel } from "../types/model";

export function lookupFolder(jobs: JobsModel): string {
    let jobPath = '';
    if (jobs && jobs.parents && jobs.parents.length > 0) {
        jobs.parents.forEach(job => {
            jobPath += `job/${job.name}/`;
        });
    }
    jobPath += `job/${jobs.name}`;
    return jobPath;
}
