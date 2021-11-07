import ArkitektonikaServer from "./http/ArkitektonikaServer";
import Logger from "./Logger";
import IDataStorage from "./storage/IDataStorage";
import Database from "./storage/Database";
import path from "path";
import * as fs from "fs";
import {Config, loadConfig} from "./config/Config";

export const FILE_EXTENSION = '.schematic';
export const DATA_DIR: string = path.join(__filename, '..', '..', 'data');
export const SCHEMATIC_DIR: string = path.join(DATA_DIR, 'schemata');

export default class Arkitektonika {

    private readonly _logger: Logger;
    private readonly _config: Config;
    private readonly httpServer: ArkitektonikaServer;
    private readonly _dataStorage: IDataStorage;

    constructor() {
        this._logger = new Logger();

        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR)
        }
        if (!fs.existsSync(SCHEMATIC_DIR)) {
            fs.mkdirSync(SCHEMATIC_DIR)
        }

        this._config = loadConfig(path.join(DATA_DIR, 'config.json'));
        this.httpServer = new ArkitektonikaServer(this);
        this._dataStorage = new Database(this._logger);
    }

    /**
     * Starts the http server for production usage.
     */
    public run(): void {
        this.httpServer.start(this._config.port || 3000);
    }

    /**
     * Prune all old or expired schematics.
     * Expired schematics are defined by {@link SchematicRecord#last_accessed}. Old or "broken" schematics are either:
     * - Schematic database entries with no matching file on the file system
     * - Dangling files on the file system without a database entry
     */
    public async prune() {
        this.logger.info("Starting prune of old or expired schematics... ")
        const deleted = await this._dataStorage.deleteExpiredSchematicRecords(this._config.prune);
        this.logger.info(`Deleted ${deleted.length} expired schematic records from the database`)
        let deletionCounter = 0;
        for (let file of fs.readdirSync(SCHEMATIC_DIR).filter(value => path.extname(value) === FILE_EXTENSION)) {
            try {
                await this._dataStorage.getSchematicRecordByDownloadKey(path.basename(file, FILE_EXTENSION))
            } catch (error) {
                // file has no matching database entry -> delete the dangling file
                this.logger.debug(`Deleting dangling file ${file}`)
                fs.rmSync(path.join(SCHEMATIC_DIR, file));
                deletionCounter++;
            }
        }
        this.logger.info(`Deleted ${deletionCounter} dangling files`);
        deletionCounter = 0;
        for (let record of (await this._dataStorage.getAllRecords())) {
            if (fs.existsSync(path.join(SCHEMATIC_DIR, record.downloadKey))) {
                continue;
            }
            if (!record.id) {
                continue;
            }
            await this._dataStorage.deleteSchematicRecord(record.id);
            deletionCounter++;
        }
        this.logger.info(`Deleted ${deletionCounter} database entries without a filesystem entry`);
    }

    get logger(): Logger {
        return this._logger;
    }

    get dataStorage(): IDataStorage {
        return this._dataStorage;
    }

    get config(): Config {
        return this._config;
    }
}