"use client";

import { BlendSweep } from "@/components/activities/blend-sweep";
import { ReadAlong } from "@/components/activities/read-along";
import { SortBaskets } from "@/components/activities/sort-baskets";
import { SyllableTap } from "@/components/activities/syllable-tap";
import { TapChoice } from "@/components/activities/tap-choice";
import { TraceLetter } from "@/components/activities/trace-letter";
import { WordBuilder } from "@/components/activities/word-builder";
import {
  interactionOf,
  type ActivityViewProps,
  type InteractionKind,
} from "@/lib/activity-types";

type ActivitySystem = (props: ActivityViewProps) => React.ReactNode;

const SYSTEMS: Record<InteractionKind, ActivitySystem> = {
  choice: TapChoice,
  sort: SortBaskets,
  "blend-sweep": BlendSweep,
  trace: TraceLetter,
  build: WordBuilder,
  syllables: SyllableTap,
  "read-along": ReadAlong,
};

/**
 * Renders whichever activity system an item declares.
 *
 * The session shell owns the hint ladder, narration, attempt recording and
 * progression; each system owns only its own interaction. Adding a new one
 * means writing a component and adding a line to this map.
 */
export function ActivityView(props: ActivityViewProps) {
  const System = SYSTEMS[interactionOf(props.activity)] ?? TapChoice;
  return <System {...props} />;
}

export {
  BlendSweep,
  ReadAlong,
  SortBaskets,
  SyllableTap,
  TapChoice,
  TraceLetter,
  WordBuilder,
};
