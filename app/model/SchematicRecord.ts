export declare type SchematicRecord = {
    id?: number | undefined,
    downloadKey: string,
    deleteKey: string,
    fileName: string,
    last_accessed?: Date | undefined,
    expired?: Date
}