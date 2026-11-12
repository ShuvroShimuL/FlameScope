import { NextResponse } from "next/server";
import { getFreeLLMAPIStatus, type FreeLLMAPIStatus } from "@/lib/vesta/freellmapi-status";
import { cooldownStatus } from "@/lib/vesta/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Several tabs polling at once share one look at FreeLLMAPI. */
const REUSE_MS = 4000;
let last: { at: number; value: FreeLLMAPIStatus | null } | null = null;

/**
 * Engine room readings: engines resting after a failure, and the local FreeLLMAPI app's health and
 * monthly token budget. Never keys, session tokens or provider error text.
 */
export async function GET() {
  if (!last || Date.now() - last.at > REUSE_MS) {
    last = { at: Date.now(), value: await getFreeLLMAPIStatus().catch(() => null) };
  }
  return NextResponse.json({ cooldowns: cooldownStatus(), freellmapi: last.value }, { headers: { "Cache-Control": "no-store" } });
}
