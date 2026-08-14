"use client";

import { useState } from "react";
import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  CheckIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { recipesFor, type Recipe, type Step } from "@/lib/actions";
import type { Gap } from "@/lib/scoring";
import { cx } from "@/lib/cx";

/**
 * PRD F4: the scorecard gaps rendered as a personal to-do list.
 *
 * Rendered inside a modal on the scorecard page rather than on its own route, and
 * receives the gaps as props so there is exactly one source of truth for the
 * answers. The dialog supplies the heading, so this component starts at the
 * summary row.
 *
 * Completion state is deliberately plain React state, per PRD F4. It is not
 * persisted: the list is derived from answers the user just gave, and reviving
 * stale checkmarks against a re-taken quiz would be misleading.
 */
export function ActionPlan({ gaps }: { gaps: Gap[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const recipes = recipesFor(gaps.map((gap) => gap.id));
  const remaining = recipes.filter((recipe) => !done[recipe.id]);
  const finished = recipes.filter((recipe) => done[recipe.id]);
  const totalMinutes = remaining.reduce((sum, recipe) => sum + recipe.minutes, 0);

  if (recipes.length === 0) return null;

  function toggle(id: string) {
    setDone((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div>
      <dl className="flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-5">
        <div>
          <dt className="tnum font-mono text-2xl leading-none text-fg">
            {remaining.length}
          </dt>
          <dd className="mt-1.5 text-xs text-fg-faint">tersisa</dd>
        </div>
        {totalMinutes > 0 && (
          <div>
            <dt className="tnum font-mono text-2xl leading-none text-fg">
              {formatMinutes(totalMinutes)}
            </dt>
            <dd className="mt-1.5 text-xs text-fg-faint">perkiraan</dd>
          </div>
        )}
        {finished.length > 0 && (
          <div>
            <dt className="tnum font-mono text-2xl leading-none text-safe">
              {finished.length}
            </dt>
            <dd className="mt-1.5 text-xs text-fg-faint">selesai</dd>
          </div>
        )}
      </dl>

      <ol className="divide-y divide-line">
        {[...remaining, ...finished].map((recipe, index) => (
          <li key={recipe.id}>
            <ActionItem
              recipe={recipe}
              index={index + 1}
              done={Boolean(done[recipe.id])}
              onToggle={() => toggle(recipe.id)}
            />
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-[62ch] border-t border-line pt-5 text-sm leading-relaxed text-fg-faint">
        Centang yang sudah dikerjakan. Tanda centang hanya berlaku selama panel ini
        terbuka, sesuai desain: daftarnya diturunkan dari jawaban kamu, jadi kalau
        kuisnya diisi ulang, centang lama tidak lagi berlaku.
      </p>
    </div>
  );
}

function ActionItem({
  recipe,
  index,
  done,
  onToggle,
}: {
  recipe: Recipe;
  index: number;
  done: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cx("py-7 transition-opacity duration-300", done && "opacity-40")}>
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? "Tandai belum selesai" : "Tandai selesai"}
          // 44px touch target per PRD section 10, with a smaller visual box.
          className="-m-3 grid size-11 shrink-0 place-items-center p-3"
        >
          <span
            className={cx(
              "grid size-5 place-items-center rounded-md border transition-colors duration-200",
              done
                ? "border-safe bg-safe text-on-accent"
                : "border-line-strong text-transparent hover:border-accent",
            )}
          >
            <CheckIcon size={12} weight="bold" />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="tnum font-mono text-xs text-fg-faint">
              {String(index).padStart(2, "0")}
            </span>
            <h3
              className={cx(
                "text-[0.9375rem] font-medium leading-snug tracking-tight text-fg",
                done && "line-through",
              )}
            >
              {recipe.title}
            </h3>
          </div>

          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-fg-subtle">
            {recipe.why}
          </p>

          {!done && (
            <>
              <ul className="mt-5 space-y-2.5">
                {recipe.steps.map((step, stepIndex) => (
                  <StepRow key={stepIndex} step={step} />
                ))}
              </ul>

              {recipe.deeper && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="inline-flex min-h-11 items-center gap-1.5 text-xs text-fg-faint transition-colors duration-200 hover:text-fg-muted"
                  >
                    <CaretDownIcon
                      size={12}
                      className={cx(
                        "transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                    Penjelasan teknisnya
                  </button>

                  {open && (
                    <p className="mt-2 max-w-[66ch] border-l border-line-strong pl-4 text-sm leading-relaxed text-fg-subtle">
                      {recipe.deeper}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <span className="tnum hidden shrink-0 font-mono text-xs text-fg-faint sm:block">
          {recipe.minutes} mnt
        </span>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  return (
    <li className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-full max-w-[13ch] shrink-0 text-xs text-fg-faint">
        {step.where}
      </span>

      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
        {step.menu && (
          <span className="text-sm leading-relaxed text-fg-muted">{step.menu}</span>
        )}
        {step.url && (
          <a
            href={step.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-sm text-accent transition-opacity duration-200 hover:opacity-75"
          >
            Buka
            <ArrowSquareOutIcon size={12} />
          </a>
        )}
        {step.verify && (
          // Surfaced rather than hidden: the PRD forbids quietly shipping a URL
          // nobody confirmed.
          <span
            title="Tautan ini belum diverifikasi manual oleh tim"
            className="inline-flex items-center gap-1 text-[0.6875rem] text-warn"
          >
            <WarningIcon size={11} />
            belum diverifikasi
          </span>
        )}
      </span>
    </li>
  );
}

function formatMinutes(total: number): string {
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours}j ${minutes}m` : `${hours}j`;
}
