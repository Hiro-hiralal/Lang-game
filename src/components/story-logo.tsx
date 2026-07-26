import { Sprout } from "lucide-react";

interface StoryLogoProps {
  compact?: boolean;
}

export function StoryLogo({ compact = false }: StoryLogoProps) {
  return (
    <div className={`story-logo ${compact ? "story-logo--compact" : ""}`}>
      <span className="story-logo__mark" aria-hidden="true">
        <Sprout strokeWidth={2.6} />
      </span>
      <span>
        <span className="story-logo__story">Story</span>
        <span className="story-logo__sprouts">Sprouts</span>
      </span>
    </div>
  );
}
