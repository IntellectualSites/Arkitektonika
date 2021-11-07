import express from "express";
import slowDown from 'express-slow-down';
import Arkitektonika, {SCHEMATIC_DIR} from "../../Arkitektonika";
import path from "path";
import * as fs from "fs";

export const DELETE_ROUTER = (app: Arkitektonika, router: express.Application) => {

    /**
     * Configures the rate limiter for the delete-route because brute force is kind of not cool
     *
     * Default:
     * Allows 30 requests per minute = 1 request every 2 seconds.
     * Each request above that limit will load for 500ms extra.
     * The 31st request will take additional 500ms to fulfill, 32nd additional 1000ms, ...
     */

    const LIMITER = slowDown({
        windowMs: app.config.limiter.windowMs || 1000 * 60,
        delayAfter: app.config.limiter.delayAfter || 30,
        delayMs: app.config.limiter.delayMs || 500
    });

    router.delete('/delete/:key', LIMITER, (async (req, res) => {
        let record;
        // search for record by download key
        try {
            record = await app.dataStorage.getSchematicRecordByDeleteKey(req.params.key)
        } catch (error) {
            return res.status(404).send({
                error: 'No record found for deletion key'
            });
        }
        if (!record.id) {
            return res.status(500).send({
                error: 'Corrupted record'
            });
        }
        await app.dataStorage.deleteSchematicRecord(record.id);
        const filePath = path.join(SCHEMATIC_DIR, record.downloadKey);
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
        }
        res.status(200).send({});
    }));

    return router;
}