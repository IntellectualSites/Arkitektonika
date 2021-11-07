import express from "express";
import Arkitektonika, {SCHEMATIC_DIR} from "../../Arkitektonika";
import path from "path";
import * as fs from "fs";

export const DOWNLOAD_ROUTER = (app: Arkitektonika, router: express.Application) => {

    router.get('/download/:key', (async (req, res) => {
        let record;
        // search for record by download key
        try {
            record = await app.dataStorage.getSchematicRecordByDownloadKey(req.params.key)
        } catch (error) {
            return res.status(404).send({
                error: 'No record found for download key'
            });
        }
        // construct the total path to the stored file internally
        const filePath = path.join(SCHEMATIC_DIR, record.downloadKey);
        try {
            // try to read binary data and send to client with initial file name
            const data = fs.readFileSync(filePath);
            res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`)
            res.send(data);
        } catch (error) {
            // file not found or corrupt - delete eventually present file and remove entry from accounting table
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath);
            }
            if (record.id) {
                await app.dataStorage.deleteSchematicRecord(record.id);
            }
            res.status(410).send({
                error: 'Persistent file not present anymore'
            });
        }
    }));

    return router;
}