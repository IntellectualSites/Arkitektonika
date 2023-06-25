import express from "express";
import fileUpload, {UploadedFile} from 'express-fileupload';
import Arkitektonika, {SCHEMATIC_DIR} from "../../Arkitektonika.js";
import * as fs from "fs";
import path from "path";
import {decode} from "nbt-ts";
import {unzip} from "gzip-js";

const UPLOAD_OPTIONS: fileUpload.Options = {
    abortOnLimit: true,
    useTempFiles: true,
    preserveExtension: ("schematic".length),
    createParentPath: true,
    safeFileNames: true,
    limits: {},
    uploadTimeout: 1000 * 15
};
export const UPLOAD_ROUTER = (app: Arkitektonika, router: express.Application) => {
    router.options('/upload', (req, res) => {
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.sendStatus(204);
    })
    router.post('/upload', fileUpload(UPLOAD_OPTIONS), (async (req, res) => {
        const file = req.files?.schematic as UploadedFile;

        // check if request contains file
        if (!file) {
            return res.status(400).send({
                error: 'Missing file'
            });
        }

        // Validate nbt file
        try {
            const content = fs.readFileSync(file.tempFilePath)
            const deflated = Buffer.from(unzip(content))
            const result = decode(deflated, {
                unnamed: false
            })
            if (result.value == null) {
                throw new Error("decoded value is null");
            }
            if (result.length > app.config.maxSchematicSize) {
                fs.unlinkSync(file.tempFilePath);
                return res.status(413).send({
                    error: `Submitted NBT file exceeds max size of ${app.config.maxSchematicSize} bytes`
                })
            }
        } catch (error) {
            app.logger.debug('Invalid request due to invalid nbt content: ' + error);
            fs.unlinkSync(file.tempFilePath);
            return res.status(400).send({
                error: 'File is not valid NBT'
            });
        }

        // Generate keys
        let downloadKey, deleteKey;
        try {
            downloadKey = await app.dataStorage.generateDownloadKey(app.config.maxIterations);
            deleteKey = await app.dataStorage.generateDeletionKey(app.config.maxIterations);
        } catch (error) {
            fs.unlinkSync(file.tempFilePath);
            return res.status(500).send({
                error: 'Failed to generate download and / or deletion key'
            });
        }

        // Insert record into accounting table
        try {
            const record = await app.dataStorage.storeSchematicRecord({
                downloadKey, deleteKey,
                fileName: file.name
            });
            await file.mv(path.join(SCHEMATIC_DIR, downloadKey))
            res.status(200).send({
                download_key: record.downloadKey,
                delete_key: record.deleteKey
            });
        } catch (error) {
            fs.unlinkSync(file.tempFilePath);
            return res.status(500).send({
                error: 'Failed to persist data in table'
            });
        }
    }));

    return router;
}