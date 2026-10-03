/** Typed fetch error so the UI can explain *why* a request failed (rate limit vs bad date). */
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "Network unreachable. Check your connection and try again.");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { msg?: string; error?: { message?: string }; reason?: string };
      detail = body.msg ?? body.error?.message ?? body.reason ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export function describeError(error: unknown): { title: string; hint: string } {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return {
        title: "NASA's rate limit reached",
        hint: "The shared DEMO_KEY allows ~30 requests an hour. Wait a bit, or deploy with your own free key from api.nasa.gov.",
      };
    if (error.status === 0) return { title: "You seem to be offline", hint: error.message };
    if (error.status >= 500) return { title: "NASA's servers are having a moment", hint: "Try again in a minute." };
    return { title: "That request didn't work", hint: error.message };
  }
  return { title: "Something went wrong", hint: error instanceof Error ? error.message : String(error) };
}
