// errors.ts
export class AppError extends Error {
  constructor(message: string, public status = 400, public code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
  }
}
export class NotFoundError extends AppError {
  constructor(msg = "Не найдено") { super(msg, 404, "NOT_FOUND"); }
}
export class ValidationError extends AppError {
  constructor(msg: string) { super(msg, 422, "VALIDATION"); }
}
export class DependencyError extends AppError {
  constructor(msg: string) { super(msg, 409, "DEPENDENCY"); }
}
