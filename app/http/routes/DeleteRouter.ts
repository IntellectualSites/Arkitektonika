import express, {Request, Response} from "express";
import slowDown from 'express-slow-down';
import Arkitektonika, {SCHEMATIC_DIR} from "../../Arkitektonika.js";
import path from "path";
import * as fs from "fs";
import {CorruptMetadata, ExpiredRecord} from "../Response.js";
import {SchematicRecord} from "../../model/SchematicRecord.js";

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

    const fetchRecord = async (request: Request, response: Response): Promise<SchematicRecord | undefined> => {
        let record;
        // search for record by download key
        try {
            record = await app.dataStorage.getSchematicRecordByDeleteKey(request.params.key);
        } catch (error) {
            response.status(404).send({
                error: 'No record found for deletion key'
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
        return record;
    }

    router.head('/delete/:key', LIMITER, (async (req, res) => {
        if (await fetchRecord(req, res)) {
            return res.sendStatus(200);
        }
    }));

    router.delete('/delete/:key', LIMITER, (async (req, res) => {
        let record = await fetchRecord(req, res);
        if (!record) {
            return;
        }
        await app.dataStorage.expireSchematicRecord(record.id!);
        const filePath = path.join(SCHEMATIC_DIR, record.downloadKey);
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
        }
        res.status(200).send({});
    }));

    return router;
}