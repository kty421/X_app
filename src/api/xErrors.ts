export type XApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limit'
  | 'network'
  | 'bad_request'
  | 'unknown';

export class XApiError extends Error {
  readonly status: number;
  readonly kind: XApiErrorKind;
  readonly title?: string;
  readonly detail?: string;
  readonly code?: string;

  constructor(
    message: string,
    options: {
      status: number;
      kind: XApiErrorKind;
      title?: string;
      detail?: string;
      code?: string;
    }
  ) {
    super(message);
    this.name = 'XApiError';
    this.status = options.status;
    this.kind = options.kind;
    this.title = options.title;
    this.detail = options.detail;
    this.code = options.code;
  }
}

export class FeedConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedConfigurationError';
  }
}

export const isXApiError = (error: unknown): error is XApiError => error instanceof XApiError;

export const isAuthExpiredError = (error: unknown): boolean =>
  error instanceof XApiError && error.status === 401;

export const isAccessDeniedError = (error: unknown): boolean =>
  error instanceof XApiError && error.status === 403;

