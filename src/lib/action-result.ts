export type ActionResult<Data = undefined, ErrorCode extends string = string> =
  | { ok: true; data: Data }
  | { ok: false; error: ErrorCode };

export function success(): ActionResult<undefined, never>;
export function success<Data>(data: Data): ActionResult<Data, never>;
export function success<Data>(data?: Data): ActionResult<Data | undefined, never> {
  return { ok: true, data };
}

export function failure<ErrorCode extends string>(error: ErrorCode): ActionResult<never, ErrorCode> {
  return { ok: false, error };
}
