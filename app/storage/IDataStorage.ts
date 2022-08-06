import {SchematicRecord} from "../model/SchematicRecord.js";

export default interface IDataStorage {

    getAllRecords(): Promise<SchematicRecord[]>;

    getAllUnexpiredRecords(): Promise<SchematicRecord[]>;

    /**
     * Retrieve a {@link SchematicRecord} from the current data storage implementation by its download key.
     *
     * @param   downloadKey The download key to search for
     * @return  Promise either containing the found {@link SchematicRecord} or
     *          a failed promise of none found matching the download key.
     */
    getSchematicRecordByDownloadKey(downloadKey: string): Promise<SchematicRecord>;

    /**
     * Retrieve a {@link SchematicRecord} from the current data storage implementation by its delete key.
     *
     * @param   deleteKey The delete key to search for
     * @return  Promise either containing the found {@link SchematicRecord} or
     *          a failed promise of none found matching the delete key.
     */
    getSchematicRecordByDeleteKey(deleteKey: string): Promise<SchematicRecord>;

    /**
     * Let a schematic record expire
     * @param recordId
     */
    expireSchematicRecord(recordId: number): Promise<any>;

    /**
     *
     * @param record
     */
    storeSchematicRecord(record: SchematicRecord): Promise<SchematicRecord>;

    /**
     * Let schematics expired if {@link SchematicRecord#last_accessed} is further than x milliseconds ago.
     * @param milliseconds  The amount of milliseconds to check last_accessed against.
     * @return              Promise either containing the expired rows or
     *                      a failed promise if something went wrong.
     */
    expireSchematicRecords(milliseconds: number): Promise<SchematicRecord[]>;

    generateDownloadKey(maxIterations: number): Promise<string>;

    generateDeletionKey(maxIterations: number): Promise<string>;

}