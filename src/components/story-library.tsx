"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, BookOpen, LockKeyhole, Volume2, X } from "lucide-react";
import { LIBRARY_STORIES } from "@/lib/world-data";
import type { LibraryStory } from "@/lib/game-types";

interface StoryLibraryProps {
  completedAdventureIds: string[];
  readStoryIds: string[];
  onBack: () => void;
  onRead: (story: LibraryStory) => void;
}

export function StoryLibrary({
  completedAdventureIds,
  readStoryIds,
  onBack,
  onRead,
}: StoryLibraryProps) {
  const [openStory, setOpenStory] = useState<LibraryStory | null>(null);

  const open = (story: LibraryStory) => {
    setOpenStory(story);
    onRead(story);
  };

  return (
    <main className="story-library">
      <section className="collection-header collection-header--stories">
        <button className="back-button" onClick={onBack}><ArrowLeft /> Back to world</button>
        <span className="section-kicker">Read again whenever you like</span>
        <h1>Pip’s story library</h1>
        <p>Each special adventure adds another tiny decodable tale to the shelf.</p>
      </section>

      <section className="story-shelf">
        {LIBRARY_STORIES.map((story, index) => {
          const unlocked = completedAdventureIds.includes(story.unlockAdventureId);
          const read = readStoryIds.includes(story.id);
          return (
            <motion.button
              className={`story-book story-book--${index % 5} ${!unlocked ? "story-book--locked" : ""}`}
              key={story.id}
              onClick={() => unlocked && open(story)}
              disabled={!unlocked}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <span className="story-book__spine" />
              <BookOpen />
              <strong>{unlocked ? story.title : "Mystery story"}</strong>
              <small>{unlocked ? story.subtitle : <><LockKeyhole /> Complete its adventure</>}</small>
              {read && <span className="story-book__read">Read</span>}
            </motion.button>
          );
        })}
      </section>

      <AnimatePresence>
        {openStory && (
          <motion.div
            className="story-reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.article initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }}>
              <button className="story-reader__close" onClick={() => setOpenStory(null)} aria-label="Close story"><X /></button>
              <span className="section-kicker">A tiny tale</span>
              <h2>{openStory.title}</h2>
              <p className="story-reader__subtitle">{openStory.subtitle}</p>
              <div className="story-reader__lines">
                {openStory.lines.map((storyLine) => <p key={storyLine}>{storyLine}</p>)}
              </div>
              <button className="primary-button" onClick={() => onRead(openStory)}>
                <Volume2 /> Hear Pip perform it
              </button>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
