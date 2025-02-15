export enum ErrorCode {
  PROCESS_TIMEOUT = 'PROCESS_TIMEOUT',
  PROCESS_FAILED = 'PROCESS_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export class LightControlError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public retriable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LightControlError';
  }
}

export class ProcessTimeoutError extends LightControlError {
  constructor(message: string = 'Process execution timed out') {
    super(message, ErrorCode.PROCESS_TIMEOUT, true);
    this.name = 'ProcessTimeoutError';
  }
}

export class ProcessFailedError extends LightControlError {
  constructor(message: string, exitCode: number) {
    super(
      `Process failed with exit code ${exitCode}: ${message}`,
      ErrorCode.PROCESS_FAILED,
      true
    );
    this.name = 'ProcessFailedError';
  }
}

export class InvalidInputError extends LightControlError {
  constructor(message: string) {
    super(message, ErrorCode.INVALID_INPUT, false);
    this.name = 'InvalidInputError';
  }
}

export class InvalidResponseError extends LightControlError {
  constructor(message: string) {
    super(message, ErrorCode.INVALID_RESPONSE, true);
    this.name = 'InvalidResponseError';
  }
}

export class NetworkError extends LightControlError {
  constructor(message: string) {
    super(message, ErrorCode.NETWORK_ERROR, true);
    this.name = 'NetworkError';
  }
}

export class SystemError extends LightControlError {
  constructor(message: string) {
    super(message, ErrorCode.SYSTEM_ERROR, false);
    this.name = 'SystemError';
  }
}