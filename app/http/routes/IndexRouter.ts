import express from "express";
import Arkitektonika from "../../Arkitektonika";

export const INDEX_ROUTER = (app: Arkitektonika, router: express.Application) => {

    router.get('/', (async (req, res) => {
        res.status(200).send({
            name: process.env.npm_package_name,
            version: process.env.npm_package_version,
            made: {
                with: 'love',
                by: 'IntellectualSites'
            }
        });
    }));

    return router;
}