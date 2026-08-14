"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowCounterClockwiseIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ActionPlan } from "./ActionPlan";
import {
  CATEGORY_LABELS,
  CHECKLIST,
  creditFor,
  scoreChecklist,
  type Answers,
  type AnswerValue,
  type Category,
  type ChecklistItem,
} from "@/lib/scoring";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStoredState } from "@/lib/useStoredState";
import { cx } from "@/lib/cx";

/** Stable empty reference, required by `useStoredState`. */
const NO_ANSWERS: Answers = {};

const OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: "yes", label: "Ya" },
  { value: "partial", label: "Ragu-ragu" },
  { value: "no", label: "Tidak" },
];

/** Group once at module scope, since the checklist is static. */
const GROUPED = CHECKLIST.reduce((map, item) => {
  const bucket = map.get(item.category) ?? [];
  bucket.push(item);
  map.set(item.category, bucket);
  return map;
}, new Map<Category, typeof CHECKLIST>());

export function ScorecardWizard() {
  // Answers never leave the device.
  const [answers, setAnswers] = useStoredState<Answers>(
    STORAGE_KEYS.scorecard,
    NO_ANSWERS,
  );
  const [planOpen, setPlanOpen] = useState(false);

  const result = useMemo(() => scoreChecklist(answers), [answers]);
  const tone = result.complete ? result.band.tone : "idle";

  return (
    <div>
      {/*
        Progress, and the score once every question is answered. Deliberately not
        sticky: the questionnaire is the task, and a rail that follows the scroll
        competes with it for attention.
      */}
      <div className="panel px-6 py-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="flex items-baseline gap-4">
            <p className="tnum font-mono text-3xl leading-none tracking-tighter text-fg">
              {result.answered}
              <span className="text-fg-ghost">/{result.total}</span>
            </p>
            <p className="text-sm text-fg-subtle">
              {result.complete ? "semua terjawab" : "pertanyaan terjawab"}
            </p>
          </div>

          {result.complete ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-2.5">
                <span
                  className={cx(
                    "tnum font-mono text-3xl leading-none tracking-tighter",
                    tone === "safe"
                      ? "text-safe"
                      : tone === "warn"
                        ? "text-warn"
                        : "text-danger",
                  )}
                >
                  {result.score}
                </span>
                <span className="tnum font-mono text-sm text-fg-ghost">/100</span>
              </div>
              <Badge tone={tone} dot>
                {result.band.label}
              </Badge>
            </div>
          ) : (
            <p className="max-w-[46ch] text-xs leading-relaxed text-fg-faint">
              Skornya muncul setelah semua pertanyaan dijawab. Angka dari jawaban
              separuh bukan gambaran keadaan siapa pun, jadi ditahan dulu.
            </p>
          )}
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-track">
          <motion.div
            className={cx(
              "h-full w-full origin-left rounded-full",
              result.complete ? "bg-safe" : "bg-accent",
            )}
            initial={false}
            animate={{ scaleX: result.answered / result.total }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          />
        </div>

        {result.complete && (
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
            <p className="min-w-[16rem] max-w-[52ch] flex-1 text-sm leading-relaxed text-fg-muted">
              {result.band.summary}
            </p>

            {result.gaps.length > 0 && (
              <Button onClick={() => setPlanOpen(true)}>
                Lihat rencana aksi
                <ArrowRightIcon size={15} weight="bold" />
              </Button>
            )}
          </div>
        )}

        {result.answered > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAnswers(NO_ANSWERS)}
            className="-ml-2 mt-4"
          >
            <ArrowCounterClockwiseIcon size={14} />
            Mulai ulang
          </Button>
        )}
      </div>

      {/* Questions */}
      <div className="mt-12 flex flex-col gap-14">
        {[...GROUPED.entries()].map(([category, items]) => {
          const bucket = result.categories.find((c) => c.category === category)!;

          return (
            <section key={category}>
              <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
                <h2 className="text-sm font-semibold tracking-tight text-fg">
                  {CATEGORY_LABELS[category]}
                </h2>
                <span className="tnum font-mono text-xs text-fg-faint">
                  {bucket.answered}/{bucket.total}
                </span>
              </div>

              <div className="divide-y divide-line">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between md:gap-10"
                  >
                    <div className="max-w-[48ch]">
                      <p className="text-[0.9375rem] leading-snug text-fg">
                        {item.question}
                      </p>
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-faint">
                        {item.rationale}
                      </p>
                    </div>

                    <Segmented
                      item={item}
                      value={answers[item.id]}
                      onChange={(value) =>
                        setAnswers((current: Answers) => ({
                          ...current,
                          [item.id]: value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {result.complete && result.gaps.length === 0 && (
          <section className="border-t border-line pt-8">
            <h2 className="text-sm font-semibold tracking-tight text-safe">
              Semuanya sudah aman
            </h2>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-fg-subtle">
              Tidak ada yang perlu dibenahi sekarang. Cek ulang sekitar enam bulan
              lagi, karena izin aplikasi dan sesi lama biasanya menumpuk lagi tanpa
              disadari.
            </p>
          </section>
        )}
      </div>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="Rencana aksi"
        description={`${result.gaps.length} langkah, diurutkan dari yang paling berdampak. Tiap langkah menyebutkan menu persisnya.`}
      >
        <ActionPlan gaps={result.gaps} />
      </Modal>
    </div>
  );
}

/**
 * Ya / Ragu-ragu / Tidak.
 *
 * The colour follows the credit the answer earns for THIS question, not the
 * literal word. Several PRD questions are phrased so that "Tidak" is the safe
 * answer ("apakah password diulang di lebih dari satu layanan?"), and painting
 * that red would tell the user the opposite of the truth.
 */
function Segmented({
  item,
  value,
  onChange,
}: {
  item: ChecklistItem;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Jawaban untuk: ${item.question}`}
      className="flex shrink-0 gap-1 rounded-lg border border-line-strong bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        const credit = creditFor(item, option.value);
        const fill = credit === 1 ? "bg-safe" : credit === 0 ? "bg-danger" : "bg-warn";

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "relative rounded-md px-3 py-2 text-xs transition-colors duration-200 active:scale-[0.97]",
              active ? "text-on-accent" : "text-fg-subtle hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                // One shared pill per question, sliding between the options
                layoutId={`segment-${item.id}`}
                className={cx("absolute inset-0 rounded-md", fill)}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
