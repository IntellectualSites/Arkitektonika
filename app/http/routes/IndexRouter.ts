import express from "express";
import Arkitektonika from "../../Arkitektonika.js";

export const INDEX_ROUTER = (app: Arkitektonika, router: express.Application) => {

    router.get('/', (async (req, res) => {
        res.status(200).send({
            name: "arkitektonika",
            version: process.env.ARK_VERSION,
            made: {
                with: 'love',
                by: 'IntellectualSites'
            }
        });
    }));

    return router;
}