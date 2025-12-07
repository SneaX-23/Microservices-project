import winston from "winston";
const {format} = winston;

const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  })
);

const prodFormat = format.combine(
    format.timestamp(),
    format.json(),
);


const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: process.env.NODE_ENV === "production" ? prodFormat: devFormat,
    defaultMeta: {
        service: "user-service",
    },
    transports: [
        new winston.transports.Console(),
        ...(process.env.NODE_ENV === "production" ? [
            new winston.transports.File({
                filename: "logs/errors.log",
                level: "error",
            }),
        ] : [])
    ],
});

export default logger;