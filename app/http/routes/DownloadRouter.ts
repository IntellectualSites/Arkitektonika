import express, {Request, Response} from "express";
import Arkitektonika, {SCHEMATIC_DIR} from "../../Arkitektonika.js";
import path from "path";
import * as fs from "fs";
import {SchematicRecord} from "../../model/SchematicRecord.js";
import {CorruptMetadata, ExpiredRecord, MissingFileSystemEntry} from "../Response.js";

export const DOWNLOAD_ROUTER = (app: Arkitektonika, router: express.Application) => {

    const fetchRecord = async (request: Request, response: Response): Promise<SchematicRecord | undefined> => {
        let record;
        // search for record by download key
        try {
            record = await app.dataStorage.getSchematicRecordByDownloadKey(request.params.key);
        } catch (error) {
            response.status(404).send({
                error: 'No record found for download key'
            });
            return undefined;
        }
        if (!record.id) {
            CorruptMetadata(response, "Missing schematic id");
            return undefined;
        }
        if (record.expired && record.expired.getMilliseconds() <= new Date().getMilliseconds()) {
            ExpiredRecord(response);
            return undefined;
        }
        if (!(fs.existsSync(path.join(SCHEMATIC_DIR, record.downloadKey)))) {
            await app.dataStorage.expireSchematicRecord(record.id);
            MissingFileSystemEntry(response);
            return undefined;
        }
        return record;
    }

    router.options('/download/:key', (req, res) => {
        res.setHeader('Access-Control-Allow-Methods', 'HEAD, GET');
        res.sendStatus(204);
    })

    router.head('/download/:key', (async (req, res) => {
        if (await fetchRecord(req, res) != undefined) {
            res.sendStatus(200);
        }
    }));

    router.get('/download/:key', (async (req, res) => {
        let record = await fetchRecord(req, res);
        if (!record) {
            return;
        }
        res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`)
        fs.createReadStream(path.join(SCHEMATIC_DIR, record.downloadKey)).pipe(res)
    }));

    return router;
}