import { AppError } from "./appError";

export const handlePrismaUniqueError = (err: any) => {
  const field = err.meta?.target ? err.meta.target[0] : "field";
  return new AppError(`Duplicate value for ${field}. Please use another value!`, 400);
};

export const handlePrismaRecordNotFound = () => {
  return new AppError("Record not found.", 404);
};

export const handlePrismaForeignKeyError = () => {
  return new AppError("Operation violates foreign key constraint.", 400);
};
