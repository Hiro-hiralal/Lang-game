"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Leaf,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SECURE_INDEPENDENT_SUCCESSES } from "@/lib/learning/mastery";
import {
  STATE_COLOR,
  STATE_LABEL,
  formatDuration,
  formatRate,
  type DashboardStats,
  type SkillSummary,
} from "@/lib/learning/dashboard";
import { ADVENTURES } from "@/lib/world-data";
import type { PlayerProgress } from "@/lib/game-types";

interface ParentDashboardProps {
  progress: PlayerProgress;
  stats: DashboardStats;
  onBack: () => void;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
  onReset: () => void;
}

/**
 * The grown-up view.
 *
 * Every number here is derived from the attempt log. It previously rendered a
 * hand-written array of five skills with invented percentages and a hardcoded
 * average session length, which is not a defensible thing to show a parent
 * about their child's learning. Where the evidence is thin, this says so.
 *
 * No reading age, percentile, or prediction, per PRD section 11.
 */
export function ParentDashboard({
  progress,
  stats,
  onBack,
  onToggleSound,
  onToggleReducedMotion,
  onReset,
}: ParentDashboardProps) {
  const averageSession = formatDuration(stats.medianSessionMs);
  const independent = formatRate(stats.independentRate);

  return (
    <main className="grownup">
      <section className="grownup__header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft />
          Back to the garden
        </button>
        <div className="grownup__title-row">
          <div>
            <span className="section-kicker">Grown-up garden</span>
            <h1>
              {stats.isEmpty
                ? "No adventures yet"
                : `${progress.childName} has completed ${progress.completedAdventureIds.length} of ${ADVENTURES.length} world adventures.`}
            </h1>
            <p>
              {stats.isEmpty
                ? "Once an adventure is finished, this page will show what was practised and what to try next. It will only ever show what actually happened."
                : "A calm view of what was practised, where things are growing, and one useful thing to try away from the screen."}
            </p>
          </div>
          <div className="grownup__pip">
            <Image src="/art/pip-fox.webp" alt="Pip the fox" fill sizes="152px" />
          </div>
        </div>
      </section>

      <section className="grownup__body">
        <div className="metric-grid">
          <MetricCard
            icon={<CalendarDays />}
            label="This week"
            value={`${stats.sessionsThisWeek} ${stats.sessionsThisWeek === 1 ? "session" : "sessions"}`}
            note={
              stats.completedSessions === 0
                ? "Nothing finished yet"
                : `${stats.completedSessions} finished all-time`
            }
            color="#E79A59"
          />
          <MetricCard
            icon={<Sparkles />}
            label="Answered without a hint"
            value={independent ?? "—"}
            note={
              independent
                ? `across ${stats.totalAttempts} tries`
                : "Not enough practice yet to say"
            }
            color="#6EAB72"
          />
          <MetricCard
            icon={<Clock3 />}
            label="Typical adventure"
            value={averageSession ?? "—"}
            note={
              averageSession
                ? "Median of finished adventures"
                : "Finish one to see this"
            }
            color="#5CA7B7"
          />
          <MetricCard
            icon={<Brain />}
            label="Remembered later"
            value={`${stats.delayedSuccesses} ${stats.delayedSuccesses === 1 ? "skill" : "skills"}`}
            note="Still correct two or more days on"
            color="#8C79B8"
          />
        </div>

        <div className="grownup__columns">
          <motion.section
            className="panel skill-panel"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="panel__heading">
              <div>
                <span className="section-kicker">Learning journey</span>
                <h2>
                  {stats.introduced.length === 0
                    ? "Nothing practised yet"
                    : "Skills met so far"}
                </h2>
              </div>
              {stats.introduced.length > 0 && (
                <span className="fresh-badge">
                  <CheckCircle2 />
                  {stats.secure.length} secure
                </span>
              )}
            </div>

            {stats.introduced.length === 0 ? (
              <p className="panel__empty">
                Skills appear here as they come up in play. Nothing is shown
                before it has been practised, so this page stays honest about
                what has and has not happened.
              </p>
            ) : (
              <div className="skill-list">
                {stats.introduced.map((summary) => (
                  <SkillRow key={summary.skillId} summary={summary} />
                ))}
              </div>
            )}

            {stats.confusions.length > 0 && (
              <div className="confusion-note">
                <strong>Sounds that get mixed up</strong>
                <ul>
                  {stats.confusions.map((pair) => (
                    <li key={`${pair.expectedId}-${pair.chosenId}`}>
                      <code>{pair.expectedId}</code> chosen as{" "}
                      <code>{pair.chosenId}</code>
                      <small>
                        {pair.count} times · {pair.label}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>

          <section className="panel offline-card">
            <span className="section-kicker">Two-minute offline idea</span>
            <div className="offline-card__art" aria-hidden="true">
              <span>m</span>
              <span>a</span>
              <span>t</span>
            </div>
            <h2>Sound-slide at breakfast</h2>
            <p>
              Put three sticky notes in a row: <strong>m</strong>,{" "}
              <strong>a</strong>, <strong>t</strong>. Slide a spoon under them
              while stretching the sounds together: “mmmaaatt.”
            </p>
            <div className="offline-card__tip">
              <Volume2 />
              Keep the sounds connected instead of pausing between them.
            </div>
          </section>
        </div>

        <section className="panel settings-panel">
          <div className="panel__heading">
            <div>
              <span className="section-kicker">Settings</span>
              <h2>Comfort, privacy and control</h2>
            </div>
            <span className="privacy-pill">
              <ShieldCheck />
              Saved on this device
            </span>
          </div>

          <div className="settings-grid">
            <button className="setting-button" onClick={onToggleSound}>
              <span>{progress.soundOn ? <Volume2 /> : <VolumeX />}</span>
              <div>
                <strong>Voice and music</strong>
                <small>
                  {progress.soundOn
                    ? "Pip performs over gentle garden music"
                    : "Currently muted"}
                </small>
              </div>
              <Toggle on={progress.soundOn} />
            </button>

            <button className="setting-button" onClick={onToggleReducedMotion}>
              <span>
                <Leaf />
              </span>
              <div>
                <strong>Calmer motion</strong>
                <small>Reduce bouncing, drifting and celebration effects</small>
              </div>
              <Toggle on={progress.reducedMotion} />
            </button>

            <button className="setting-button" onClick={() => window.print()}>
              <span>
                <Download />
              </span>
              <div>
                <strong>Save progress card</strong>
                <small>Print or save this grown-up summary as a PDF</small>
              </div>
            </button>

            <button className="setting-button" onClick={onReset}>
              <span>
                <RotateCcw />
              </span>
              <div>
                <strong>Erase everything</strong>
                <small>Delete all progress and the learning record</small>
              </div>
            </button>
          </div>
        </section>

        <p className="grownup__privacy-note">
          Progress and the learning record are stored only in this browser. The
          record holds lesson outcomes — which item, whether it was right, and
          whether a hint was used. It does not record a child, upload speech, or
          use behavioural advertising.
        </p>
      </section>
    </main>
  );
}

function SkillRow({ summary }: { summary: SkillSummary }) {
  const { record } = summary;
  const color = STATE_COLOR[record.state];

  // The bar and the figure both show progress toward secure, not a score. A
  // count is meaningful from the very first success, where a percentage over
  // two attempts would be noise presented as a finding.
  const progress = Math.min(
    record.independentSuccesses / SECURE_INDEPENDENT_SUCCESSES,
    1,
  );

  return (
    <div className="skill-row">
      <div className="skill-row__title">
        <span className="skill-row__leaf" style={{ background: color }}>
          <Leaf />
        </span>
        <div>
          <strong>{summary.label}</strong>
          <small>
            {STATE_LABEL[record.state]}
            {record.assistedSuccesses > 0 &&
              ` · ${record.assistedSuccesses} with help`}
          </small>
        </div>
      </div>
      <div
        className="skill-row__meter"
        role="img"
        aria-label={`${record.independentSuccesses} of ${SECURE_INDEPENDENT_SUCCESSES} unaided successes`}
      >
        <span style={{ width: `${progress * 100}%`, background: color }} />
      </div>
      <strong className="skill-row__score" title="Unaided successes needed to count as secure">
        {record.independentSuccesses}/{SECURE_INDEPENDENT_SUCCESSES}
      </strong>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  color: string;
}

function MetricCard({ icon, label, value, note, color }: MetricCardProps) {
  return (
    <motion.article
      className="metric-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
    >
      <span className="metric-card__icon" style={{ background: color }}>
        {icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </motion.article>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`toggle ${on ? "toggle--on" : ""}`} aria-hidden="true">
      <span />
    </span>
  );
}
