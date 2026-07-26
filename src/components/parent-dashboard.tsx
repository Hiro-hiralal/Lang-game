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
import { SKILL_ROWS } from "@/lib/game-data";
import type { PlayerProgress } from "@/lib/game-types";

interface ParentDashboardProps {
  progress: PlayerProgress;
  onBack: () => void;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
  onReset: () => void;
}

export function ParentDashboard({
  progress,
  onBack,
  onToggleSound,
  onToggleReducedMotion,
  onReset,
}: ParentDashboardProps) {
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
              {progress.childName} has completed{" "}
              {progress.completedAdventureIds.length} of 20 world adventures.
            </h1>
            <p>
              A calm view of what she practiced, where she is growing and one
              useful thing to try away from the screen.
            </p>
          </div>
          <div className="grownup__pip">
            <Image
              src="/art/pip-fox.webp"
              alt="Pip the fox"
              fill
              sizes="152px"
            />
          </div>
        </div>
      </section>

      <section className="grownup__body">
        <div className="metric-grid">
          <MetricCard
            icon={<CalendarDays />}
            label="This week"
            value={`${progress.sessionsCompleted} sessions`}
            note="A healthy little rhythm"
            color="#E79A59"
          />
          <MetricCard
            icon={<Sparkles />}
            label="Independent wins"
            value={`${progress.totalStars} stars`}
            note={`${progress.unlockedStickerIds.length} treasures collected`}
            color="#6EAB72"
          />
          <MetricCard
            icon={<Clock3 />}
            label="Average adventure"
            value="5m 08s"
            note="Right in the target range"
            color="#5CA7B7"
          />
          <MetricCard
            icon={<Brain />}
            label="Current focus"
            value={
              progress.completedAdventureIds.length < 8
                ? "Sound foundations"
                : progress.completedAdventureIds.length < 16
                  ? "Words & blending"
                  : "Story meaning"
            }
            note="The world opens in a deliberate sequence"
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
                <h2>Skills are blooming</h2>
              </div>
              <span className="fresh-badge">
                <CheckCircle2 />
                Updated today
              </span>
            </div>
            <div className="skill-list">
              {SKILL_ROWS.map((skill) => (
                <div className="skill-row" key={skill.name}>
                  <div className="skill-row__title">
                    <span
                      className="skill-row__leaf"
                      style={{ background: skill.color }}
                    >
                      <Leaf />
                    </span>
                    <div>
                      <strong>{skill.name}</strong>
                      <small>{skill.status}</small>
                    </div>
                  </div>
                  <div className="skill-row__meter" aria-label={`${skill.score}%`}>
                    <span
                      style={{
                        width: `${skill.score}%`,
                        background: skill.color,
                      }}
                    />
                  </div>
                  <strong className="skill-row__score">{skill.score}%</strong>
                </div>
              ))}
            </div>
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
              <span className="section-kicker">Showcase settings</span>
              <h2>Comfort, privacy and control</h2>
            </div>
            <span className="privacy-pill">
              <ShieldCheck />
              Saved on this device
            </span>
          </div>

          <div className="settings-grid">
            <button className="setting-button" onClick={onToggleSound}>
              <span>
                {progress.soundOn ? <Volume2 /> : <VolumeX />}
              </span>
              <div>
                <strong>Voice and music</strong>
                <small>
                  {progress.soundOn ? "Pip performs over gentle garden music" : "Currently muted"}
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
                <strong>Reset the showcase</strong>
                <small>Return to the polished starting progress</small>
              </div>
            </button>
          </div>
        </section>

        <p className="grownup__privacy-note">
          This showcase stores progress only in this browser. It does not record
          a child, upload speech or use behavioral advertising.
        </p>
      </section>
    </main>
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
