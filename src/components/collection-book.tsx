"use client";

import { motion } from "motion/react";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { STICKERS } from "@/lib/world-data";

interface CollectionBookProps {
  unlockedStickerIds: string[];
  onBack: () => void;
}

export function CollectionBook({
  unlockedStickerIds,
  onBack,
}: CollectionBookProps) {
  return (
    <main className="collection-book">
      <section className="collection-header collection-header--treasures">
        <button className="back-button" onClick={onBack}><ArrowLeft /> Back to world</button>
        <span className="section-kicker">Every chapter leaves a keepsake</span>
        <h1>The treasure book</h1>
        <p>{unlockedStickerIds.length} of 20 magical treasures discovered.</p>
      </section>

      <section className="sticker-grid">
        {STICKERS.map((sticker, index) => {
          const unlocked = unlockedStickerIds.includes(sticker.id);
          return (
            <motion.article
              className={`sticker-card ${!unlocked ? "sticker-card--locked" : ""}`}
              key={sticker.id}
              initial={{ opacity: 0, scale: 0.9, rotate: index % 2 ? 2 : -2 }}
              animate={{ opacity: 1, scale: 1, rotate: index % 2 ? 1 : -1 }}
              transition={{ delay: index * 0.025 }}
            >
              <span className="sticker-card__number">{String(index + 1).padStart(2, "0")}</span>
              <div className="sticker-card__icon">
                {unlocked ? sticker.icon : <LockKeyhole />}
              </div>
              <strong>{unlocked ? sticker.name : "Undiscovered"}</strong>
              <p>{unlocked ? sticker.description : "Complete its chapter to reveal this treasure."}</p>
              {unlocked && <span className="sticker-card__spark"><Sparkles /></span>}
            </motion.article>
          );
        })}
      </section>
    </main>
  );
}
