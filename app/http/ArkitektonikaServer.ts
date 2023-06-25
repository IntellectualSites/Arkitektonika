import express from 'express';
import {Express} from 'express';
import Logger from "../Logger.js";
import Arkitektonika from "../Arkitektonika.js";
import {DOWNLOAD_ROUTER} from "./routes/DownloadRouter.js";
import {UPLOAD_ROUTER} from "./routes/UploadRouter.js";
import {INDEX_ROUTER} from "./routes/IndexRouter.js";
import {DELETE_ROUTER} from "./routes/DeleteRouter.js";

export default class ArkitektonikaServer {

    private readonly logger: Logger;
    private readonly app: Express;

    constructor(app: Arkitektonika) {
        this.logger = app.logger;
        this.app = express();

        this.app.use((req, res, next) => {
           res.setHeader('Access-Control-Allow-Origin', app.config.allowedOrigin);
           next();
        });
        this.app.use(this.logger.getExpressLogger());

        INDEX_ROUTER(app, this.app)
        UPLOAD_ROUTER(app, this.app)
        DOWNLOAD_ROUTER(app, this.app)
        DELETE_ROUTER(app, this.app)
    }

    public start(port: number = 3000): void {
        this.app.listen(port, () => {
            this.logger.info(`Arkitektonika server up and running @ 0.0.0.0:${port}`)
        });
    }

}