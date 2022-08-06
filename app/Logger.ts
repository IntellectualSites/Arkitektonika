import winston from 'winston';
import * as Transport from 'winston-transport';
import expressWinston from 'express-winston';
import {Handler, Request, Response} from "express";
import chalk from 'chalk';

export default class Logger {

    private readonly logger: winston.Logger;
    private readonly transport: Transport = new winston.transports.Console();
    private readonly format = winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format((info) => {
            info.level = info.level.toUpperCase();
            return info;
        })(),
        winston.format.colorize(),
        winston.format.printf((info) => {
            return "[" + info.level + " | " + info.timestamp + "] " + info.message;
        }),
    );

    constructor() {
        this.logger = winston.createLogger({
            transports: this.transport,
            format: this.format,
            level: Logger.getLogLevel()
        });
    }

    public info(message: string, ...meta: any[]): void {
        this.logger.info(message, meta);
    }

    public error(message: string, ...meta: any[]): void {
        this.logger.error(message, meta);
    }

    public debug(message: string, ...meta: any[]): void {
        this.logger.debug(message, meta);
    }

    public getExpressLogger(): Handler {
        return expressWinston.logger({
            transports: [this.transport],
            colorize: true,
            format: this.format,
            level: Logger.getLogLevel(),
            msg: (req: Request, res: Response) => {
                const substrTo = Math.min(req.url.length, 50);
                const shortened = req.url.length > 50;
                const url = req.url.substr(0, substrTo) + (shortened ? '...' : '');
                return chalk.grey(`${req.method} ${url}`) + (shortened ? chalk.blueBright(' (URL Shortened)') : '') +
                    ` ${res.statusCode} ` +
                    chalk.grey(`{{res.responseTime}}ms`)
            }
        });
    }

    public static getLogLevel(): string {
        let level = (process.env.LOG_LEVEL || 'info').toLowerCase();
        if (['error', 'warn', 'info', 'verbose', 'debug', 'silly'].indexOf(level) === -1) {
            level = 'info';
        }
        return level;
    }

}