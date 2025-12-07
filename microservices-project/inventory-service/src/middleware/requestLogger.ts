import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { randomUUID } from "crypto";

// export function requestLogger(req: Request, res: Response, next: NextFunction) {
//   const start = Date.now();
//   const requestId = randomUUID();

//   (req as any).requestId = requestId;

//   res.on("finish", () => {
//     const duration = Date.now() - start;

//     const log = {
//       requestId,
//       method: req.method,
//       url: req.originalUrl,
//       status: res.statusCode,
//       duration: `${duration}ms`,
//     };

//     if (req.user) log["userId"] = req.user.id;

//     if (res.statusCode >= 500) {
//       logger.error(log);
//     } else if (res.statusCode >= 400) {
//       logger.warn(log);
//     } else {
//       logger.info(log);
//     }
//   });

//   next();
// }

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestId = randomUUID();

    res.on("finish", () => {
        const duration = Date.now() - start;

        logger.info({
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
}