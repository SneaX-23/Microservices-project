import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import logger from "../utils/logger";
// import {
//   handlePrismaUniqueError,
//   handlePrismaForeignKeyError,
//   handlePrismaRecordNotFound,
// } from "../utils/prismaError";
// import { handleJWTError, handleJWTExpiredError } from "../utils/jwtError";

const formatDevError = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const formatProdError = (err: any, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  //LOG EVERY ERROR (Operational or not)
  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
  });

  //DEV MODE: return full details
  if (process.env.NODE_ENV === "development") {
    return formatDevError(err, res);
  }

  // PROD MODE, Only operational errors get safe messages
  let error = err;

  // if (err.code === "P2002") error = handlePrismaUniqueError(err);
  // if (err.code === "P2025") error = handlePrismaRecordNotFound();
  // if (err.code === "P2003") error = handlePrismaForeignKeyError();

  // if (err.name === "JsonWebTokenError") error = handleJWTError();
  // if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  return formatProdError(error, res);
};
