import sqlite from 'better-sqlite3';
import Logger from "../Logger";
import IDataStorage from "./IDataStorage";
import {SchematicRecord} from "../model/SchematicRecord";
import path from "path";
import {DATA_DIR} from "../Arkitektonika";
import {nanoid} from "nanoid";

export default class Database implements IDataStorage {

    private readonly database: sqlite.Database;

    constructor(logger: Logger) {
        this.database = sqlite(path.join(DATA_DIR, 'database.db'), {
            verbose: (message, additionalArgs) => logger.debug(message, additionalArgs)
        });
        this.migrate();
    }

    getAllRecords(): Promise<SchematicRecord[]> {
        return new Promise((resolve) => {
            const rows = this.database.prepare('SELECT * FROM accounting').all();
            resolve(rows.map(value => Database.transformRowToRecord(value)));
        });
    }

    /**
     * @inheritDoc
     */
    getSchematicRecordByDeleteKey(deleteKey: string): Promise<SchematicRecord> {
        return new Promise(async (resolve, reject) => {
            const result = this.database.prepare('SELECT * FROM accounting WHERE delete_key = ? LIMIT 1')
                .get(deleteKey);
            if (!result) {
                return reject("No data found for passed delete key");
            }
            resolve(Database.transformRowToRecord(result));
        });
    }

    /**
     * @inheritDoc
     */
    getSchematicRecordByDownloadKey(downloadKey: string): Promise<SchematicRecord> {
        return new Promise(async (resolve, reject) => {
            const result = this.database.prepare('SELECT * FROM accounting WHERE download_key = ? LIMIT 1')
                .get(downloadKey);
            if (!result) {
                return reject("No data found for passed download key");
            }
            resolve(Database.transformRowToRecord(result));
        });
    }

    /**
     * @inheritDoc
     */
    deleteSchematicRecord(recordId: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const changes = this.database.prepare('DELETE FROM accounting WHERE id = ?')
                    .run(recordId).changes;
                if (changes < 1) {
                    return reject(new Error("Failed to delete schematic - No schematic exists with passed id"));
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @inheritDoc
     */
    expireSchematicRecord(recordId: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const changes = this.database.prepare('UPDATE accounting SET expired = ? WHERE id = ?')
                    .run(Date.now(), recordId).changes;
                if (changes < 1) {
                    return reject(new Error("Failed to expire schematic - No schematic exists with passed id"));
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @inheritDoc
     */
    storeSchematicRecord(record: SchematicRecord): Promise<SchematicRecord> {
        return new Promise(async (resolve, reject) => {
            try {
                this.database.prepare('INSERT INTO accounting (filename, download_key, delete_key, last_accessed) VALUES (?, ?, ?, ?)')
                    .bind([record.fileName, record.downloadKey, record.deleteKey, Date.now()]).run();
                resolve(record);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @inheritDoc
     */
    expireSchematicRecords(milliseconds: number): Promise<SchematicRecord[]> {
        return new Promise(async (resolve, reject) => {
            try {
                // retrieve rows to delete
                const rows = this.database.prepare('SELECT * FROM accounting WHERE last_accessed <= ?')
                    .all((Date.now() - milliseconds));
                if (rows.length == 0) {
                    return resolve([]);
                }
                const records: SchematicRecord[] = rows.map(entry => Database.transformRowToRecord(entry));

                const stmt = this.database.prepare('UPDATE accounting SET expired = ? WHERE id = ?');

                for (let record of records) {
                    stmt.run(Date.now(), record.id);
                }

                resolve(records);
            } catch (error) {
                reject(error);
            }
        });
    }

    generateDeletionKey(maxIterations: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let iterations = 0;
            let key: string | null;
            do {
                key = nanoid(32);
                const dbResult = this.database.prepare('SELECT id FROM accounting where delete_key = ? LIMIT 1')
                    .get(key)
                if (dbResult) {
                    key = null;
                    continue
                }
                resolve(key);
            } while (key == null && (iterations++ < maxIterations))
            reject();
        });
    }

    generateDownloadKey(maxIterations: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let iterations = 0;
            let key: string | null;
            do {
                key = nanoid(32);
                const dbResult = this.database.prepare('SELECT id FROM accounting where download_key = ? LIMIT 1')
                    .get(key)
                if (dbResult) {
                    key = null;
                    continue
                }
                resolve(key);
            } while (key == null && (iterations++ < maxIterations))
            reject();
        });
    }


    /**
     * Set up the database
     * @private
     */
    private migrate(): void {
        this.database.prepare(`create table if not exists accounting (
                id integer not null,
                download_key char(32) not null,
                delete_key char(32) not null,
                filename char(33) not null,
                last_accessed integer not null,
                expired date,
                constraint accounting_pk primary key (id autoincrement))`).run();
        [
            'create unique index if not exists accounting_id_uindex on accounting (id);',
            'create unique index if not exists accounting_download_key_uindex on accounting (download_key);',
            'create unique index if not exists accounting_delete_key_uindex on accounting (delete_key);',
        ].forEach(qry => this.database.prepare(qry).run());
    }

    /**
     * Internal helper method to map a database row to a {@link SchematicRecord} instance.
     * @param row The database row to convert.
     * @private
     */
    private static transformRowToRecord(row: any): SchematicRecord {
        return {
            id: row.id,
            downloadKey: row.download_key,
            deleteKey: row.delete_key,
            fileName: row.filename,
            expired: row.expired,
            last_accessed: row.last_accessed
        }
    }
}