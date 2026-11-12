import { apiError, json } from "@/lib/api";
import { askBurn, BURN_PARAM_KEYS, BurnInputError, type BurnParams } from "@/lib/burn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KNOWN = new Set<string>(BURN_PARAM_KEYS);
const MAX_VALUE_CHARS = 500;

/**
 * Will it burn? One cabin scenario checked against NASA's BASS-II solid-material tests.
 * Send a question (`q`), explicit conditions, or both; explicit conditions win over the question.
 * The answer is computed by fixed rules from committed source rows. No model is involved.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const params: BurnParams = {};
  for (const [key, value] of sp) {
    if (!KNOWN.has(key)) return apiError(`unknown parameter: ${key.slice(0, 40)}`);
    if (value.length > MAX_VALUE_CHARS) return apiError(`${key} is longer than ${MAX_VALUE_CHARS} characters`);
    if (value !== "") params[key as keyof BurnParams] = value;
  }
  try {
    // The same request always gives the same answer, so it can be cached like the other read-only routes.
    return json(askBurn(params));
  } catch (e) {
    if (e instanceof BurnInputError) return apiError(e.message);
    return apiError("unable to answer this request", 500);
  }
}
