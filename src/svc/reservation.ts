import FormData from 'form-data';
import { Executor } from '../api/executor';
import { ReservationProvider } from '../sidebar/reservation-provider';
import { JobsModel } from '../types/model';

export class ReservationScheduler {

    private _executor: Executor | undefined;

    private _reservationModel: ReservationJobModel[] = [];

    private _max: number = 15;

    constructor(private readonly reservationProvider: ReservationProvider) {
    }

    public scheduleAction(job: JobsModel, delayInMinutes: number, formData: FormData) {
        if (this._reservationModel.length >= this._max) {
            console.log('Maximum number of reservations reached.');
            return;
        }

        const delayInMilliseconds = delayInMinutes * 60 * 1000;
        const reservationJobModel: ReservationJobModel = {
            id: job.name + '-' + this.generateId(),
            jobModel: job,
            delayInMinutes: delayInMinutes,
            runTime: new Date().getTime() + delayInMilliseconds,
            formData: formData
        };
        const id = reservationJobModel.id;

        const timer = setTimeout(() => {
            this.executeAction(reservationJobModel);
        }, delayInMilliseconds);
        reservationJobModel.timer = timer;
        this._reservationModel.push(reservationJobModel);
        this._reservationModel.sort((a, b) => a.runTime - b.runTime);
    }

    public cancelAction(reservationJobModel: ReservationJobModel) {
        const index = this._reservationModel.findIndex(action => action.id === reservationJobModel.id);
        if (index !== -1) {
            this._reservationModel.splice(index, 1);
            // const { timer } = this._reservationModel[index];
            clearTimeout(reservationJobModel.timer);
        }
    }

    public isEmpty(): boolean {
        return !this._reservationModel || this._reservationModel.length === 0 ? true : false;
    }

    public clear() {
        const size = this._reservationModel.length;
        for (let i = 0; i < size; i++) {
            const jobModel = this._reservationModel.pop();
            clearTimeout(jobModel?.timer);
        }
    }

    public get reservationModel(): ReservationJobModel[] {
        return this._reservationModel;
    }

    public set executor(executor: Executor | undefined) {
        this._executor = executor;
        if (!executor) {
            this.clear();
        }
    }

    private executeAction(reservationModel: ReservationJobModel) {
        const index = this._reservationModel.findIndex(action => action.id === reservationModel.id);
        if (index !== -1) {
            this._reservationModel.splice(index, 1);
            this._executor?.buildJobWithForm(reservationModel.jobModel, reservationModel.formData, 2);
        }
        this.reservationProvider.refresh();
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2);
    }

}

export interface ReservationJobModel {
    id: string;
    jobModel: JobsModel;
    delayInMinutes: number;
    runTime: number;
    formData: FormData;
    timer?: NodeJS.Timeout;
}
