import express from "express";
import Arkitektonika from "../../Arkitektonika";

export const INDEX_ROUTER = (app: Arkitektonika, router: express.Application) => {

    const data = require('./../../../package.json');

    router.get('/', (async (req, res) => {
        res.status(200).send({
            name: data.name,
            version: data.version,
            made: {
                with: 'love',
                by: 'IntellectualSites'
            }
        });
    }));

    return router;
}