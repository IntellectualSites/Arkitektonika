import * as fs from "fs";
import {PathLike} from "fs";

export declare type Config = {
    port: number,
    prune: number,
    maxIterations: number,
    maxSchematicSize: number,
    allowedOrigin: string,
    limiter: {
        windowMs: number,
        delayAfter: number,
        delayMs: number,
    }
};

const DEFAULT_CONFIG: Config = {
    port: 3000,
    prune: 1000 * 60 * 30,
    maxIterations: 20,
    maxSchematicSize: 1000 * 1000, // 1 MB
    allowedOrigin: '*',
    limiter: {
        windowMs: 1000 * 60,
        delayAfter: 30,
        delayMs: 500
    }
};

const parseConfigContent = (content: string): Config => {
    const json = JSON.parse(content);
    try {
        return json as Config;
    } catch (error) {
        return Object.assign(DEFAULT_CONFIG, json);
    }
}

export const loadConfig = (file: PathLike): Config => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(DEFAULT_CONFIG, null, 2));
        return DEFAULT_CONFIG;
    }
    try {
        return parseConfigContent(fs.readFileSync(file).toString());
    } catch (error) {
        throw error
    }
}