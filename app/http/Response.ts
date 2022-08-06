import {Response} from "express";

const HTTP_EXPIRED = 420;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

export const ExpiredRecord = (response: Response) => {
    response.status(HTTP_EXPIRED).send({
        error: "This schematic file already expired"
    });
};

export const CorruptMetadata = (response: Response, reason: string) => {
    response.status(HTTP_INTERNAL_SERVER_ERROR).send({
        error: `Corrupt metadata: ${reason}`
    });
};

export const SchematicNotFound = (response: Response) => {
    response.status(HTTP_NOT_FOUND).send({
        error: `Schematic file was not found`
    });
}

export const MissingFileSystemEntry = (response: Response) => {
    response.status(HTTP_EXPIRED).send({
        error: "Missing file in file system for schematic record - Expiring this record"
    })
}