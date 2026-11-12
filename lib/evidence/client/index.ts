/**
 * The typed front door to the engine's browser-side modules: request ordering (state.mjs), the saved-question
 * list (library.mjs) and the Markdown brief (brief.mjs). They are plain JavaScript with no Node API, so the page
 * runs exactly the code the tests run. This file only gives them types; it adds no behaviour.
 */
import type { BurnAnswer, BurnParams, BurnRecord } from "../types";
import { briefFileName as fileName, briefMarkdown as markdown } from "./brief.mjs";
import { createQuestionLibrary as makeLibrary, LIBRARY_KEY as KEY, LIBRARY_LIMIT as LIMIT } from "./library.mjs";
import { askedFor as asked, createController as makeController } from "./state.mjs";

/** What produced an answer: a typed question, a tapped control, or a saved question reopened. */
export interface AnswerMeta {
  kind: "question" | "tap" | "restore";
  question?: string;
  params: BurnParams;
}

export interface ControllerOptions {
  request: (params: BurnParams) => Promise<BurnAnswer>;
  onAnswer: (answer: BurnAnswer, meta: AnswerMeta) => void;
  onError: (error: Error, meta: AnswerMeta) => void;
  onBusy?: (busy: boolean, meta: AnswerMeta) => void;
}

/** Sends questions and taps in order. The newest intent always wins; a late reply to an older one is dropped. */
export interface Controller {
  ask(question: string): Promise<void>;
  change(patch: BurnParams): Promise<void>;
  restore(params: BurnParams, question: string): Promise<void>;
  readonly answered: BurnAnswer | null;
}

export interface SavedQuestion {
  id: string;
  question: string;
  params: BurnParams;
  savedAt: number;
}

/** Saved questions hold the question and its request only. An answer is never stored. */
export interface QuestionLibrary {
  reload(): void;
  readonly durable: boolean;
  readonly canUndo: boolean;
  list(search?: string): SavedQuestion[];
  record(question: string, params: BurnParams): boolean;
  remove(id: string): boolean;
  undo(): boolean;
}

export interface BriefOptions {
  asked?: string;
  records?: BurnRecord[];
  product?: string;
  date?: string;
}

export const LIBRARY_KEY: string = KEY;
export const LIBRARY_LIMIT: number = LIMIT;
export const createController = makeController as unknown as (options: ControllerOptions) => Controller;
export const createQuestionLibrary = makeLibrary as unknown as (storage: Pick<Storage, "getItem" | "setItem"> | null, options?: { now?: () => number }) => QuestionLibrary;
export const askedFor = asked as unknown as (answer: BurnAnswer, meta: AnswerMeta) => string;
export const briefMarkdown = markdown as unknown as (answer: BurnAnswer, options?: BriefOptions) => string;
export const briefFileName = fileName as unknown as (answer: Pick<BurnAnswer, "question" | "canonical">, prefix?: string) => string;
