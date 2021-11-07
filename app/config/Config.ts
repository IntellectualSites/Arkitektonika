import * as fs from "fs";
import {PathLike} from "fs";

export declare type Config = {
    port: number,
    prune: number,
    maxIterations: number
};

const DEFAULT_CONFIG: Config = {
    port: 3000,
    prune: 1000 * 60 * 30,
    maxIterations: 20
};

const parseConfigContent = (content: string): Config => {
    return JSON.parse(content) as Config;
}

export const loadConfig = (file: PathLike): Config => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
    }
    try {
        return parseConfigContent(fs.readFileSync(file).toString());
    } catch (error) {
        throw error
    }
}