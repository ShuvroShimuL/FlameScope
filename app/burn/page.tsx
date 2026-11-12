import type { Metadata } from "next";
import { Suspense } from "react";
import { BurnView } from "@/components/burn/BurnView";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Will it burn?",
  description:
    "Ask about a solid material in a spacecraft cabin and see what NASA's BASS-II microgravity tests recorded: the matching source rows, or the gap that stops an answer. Not a prediction and not a safety rating.",
};

export default function BurnPage() {
  return (
    <>
      <PageHeader eyebrow="Solid materials · NASA BASS-II" title="Will it burn?">
        Ask about a material in a cabin. The answer comes from NASA&apos;s BASS-II tests of acrylic sheets, SIBAL fabric and Nomex in microgravity, and a test counts only if its own row recorded every condition you gave.
        You get what NASA observed, with the source rows, or a named gap. Never a prediction, and never a safety rating.
      </PageHeader>
      {/* BurnView reads ?q= from the address, so it renders in the browser. */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-panel" />}>
        <BurnView />
      </Suspense>
    </>
  );
}
