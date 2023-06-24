import events from "events";
import _ from "lodash";
export class LogStream extends events.EventEmitter {

    _jenkins: any;
    _delay: number;
    _opts: any;
    _timeoutId: NodeJS.Timeout | null;
    _end: boolean;

    constructor(jenkins: any, opts: any) {
        super();
        this._jenkins = jenkins;

        opts = _.clone(opts || {});

        this._delay = opts.delay || 1000;
        delete opts.delay;

        this._opts = opts;
        this._opts.meta = true;

        process.nextTick(() => {
            this._run();
        });

        this._timeoutId = null;
        this._end = false;
    }

    /**
     * End watch
     */
    end(): void {
        if (this._timeoutId) {clearTimeout(this._timeoutId);}

        if (this._end) {return;}
        this._end = true;

        this.emit("end");
    }

    /**
     * Error helper
     */
    _err(err: Error): void {
        if (this._end) {return;}

        this.emit("error", err);

        this.end();
    }

    /**
     * Run
     */
    async _run(): Promise<void> {
        if (this._end) {return;}

        try {
            const data = await this._jenkins.build.log(this._opts);
            if (this._end) {return;}

            if (typeof data.text === "string") {this.emit("data", data.text);}

            if (!data.more) {return this.end();}
            if (data.size) {this._opts.start = data.size;}

            this._timeoutId = setTimeout(() => {
                this._run();
            }, this._delay);
        } catch (err: any) {
            if (this._end) {return;}
            return this._err(err);
        }
    }

}
