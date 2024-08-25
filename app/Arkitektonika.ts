import ArkitektonikaServer from "./http/ArkitektonikaServer.js";
import Logger from "./Logger.js";
import IDataStorage from "./storage/IDataStorage.js";
import Database from "./storage/Database.js";
import path from "path";
import * as fs from "fs";
import {Config, loadConfig} from "./config/Config.js";
import {fileURLToPath} from "url";

const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PACKAGE_JSON = path.join(ROOT_DIR, "package.json")

export const DATA_DIR: string = path.join(ROOT_DIR, 'data');
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
        process.env.ARK_VERSION = JSON.parse(fs.readFileSync(PACKAGE_JSON).toString()).version
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
        const deleted = await this._dataStorage.expireSchematicRecords(this._config.prune);
        for (let record of deleted) {
            fs.rmSync(path.join(SCHEMATIC_DIR, record.downloadKey))
        }
        this.logger.info(`Expired ${deleted.length} schematic records from the database and deleted file system entries`)
        let deletionCounter = 0;
        for (let file of fs.readdirSync(SCHEMATIC_DIR)) {
            try {
                await this._dataStorage.getSchematicRecordByDownloadKey(path.basename(file))
            } catch (error) {
                // file has no matching database entry -> delete the dangling file
                this.logger.debug(`Deleting dangling file ${file}`)
                fs.rmSync(path.join(SCHEMATIC_DIR, file));
                deletionCounter++;
            }
        }
        this.logger.info(`Deleted ${deletionCounter} dangling files`);
        deletionCounter = 0;
        for (let record of (await this._dataStorage.getAllUnexpiredRecords())) {
            if (fs.existsSync(path.join(SCHEMATIC_DIR, record.downloadKey))) {
                continue;
            }
            if (!record.id) {
                continue;
            }
            await this._dataStorage.expireSchematicRecord(record.id);
            this.logger.debug(`Expired schematic with id ${record.id} because no file system entry was present`)
            deletionCounter++;
        }
        this.logger.info(`Pruned ${deletionCounter} schematic records`);
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