export type VoiceMood =
  | "welcome"
  | "curious"
  | "coach"
  | "celebrate"
  | "story";

export interface VoiceLine {
  text: string;
  mood: VoiceMood;
}

export const VOICE_LINES: Record<string, VoiceLine> = {
  welcome: {
    mood: "welcome",
    text: "Oh! There you are, story explorer! I found a garden path full of silly sounds, glowing letters, and one tiny tale. Ready to make some words bloom?",
  },
  map: {
    mood: "curious",
    text: "I picked a path with sounds you know, plus one brand-new word-growing trick. Stay close. We will solve every stop together!",
  },
  "sound.prompt": {
    mood: "curious",
    text: "First, a listening game! Star. Car. Hear how their tails sing the same little song? Which picture rhymes with star: car, moon, or fish?",
  },
  "sound.hint.1": {
    mood: "coach",
    text: "Listen to the ends. St-ar. C-ar. They both finish with ar. Find car.",
  },
  "sound.hint.2": {
    mood: "coach",
    text: "I will make the matching pair extra bouncy: star, car! Tap the little car.",
  },
  "sound.correct": {
    mood: "celebrate",
    text: "Star, car! A perfect rhyme. Your listening ears are sparkling!",
  },
  "sound.wrong.moon": {
    mood: "coach",
    text: "Moon has a long oo sound at the end. Star ends with ar. Let us find another word that ends with ar.",
  },
  "sound.wrong.fish": {
    mood: "coach",
    text: "Fish ends with ish. Star ends with ar. Listen for the picture whose name ends with ar.",
  },
  "letter.prompt": {
    mood: "curious",
    text: "Close your lips and hum with me: mmmmmmm. Like moon, mouse, and muffin. Which lowercase letter makes that humming sound?",
  },
  "letter.hint.1": {
    mood: "coach",
    text: "Feel the hum behind your closed lips: mmmmm. Look for the letter shaped like two small hills.",
  },
  "letter.hint.2": {
    mood: "coach",
    text: "Here is our sound one more time: mmmmm. The matching letter is lowercase m. Tap m.",
  },
  "letter.correct": {
    mood: "celebrate",
    text: "Mmmmm, marvelous! Lowercase m makes our humming sound. You lit the lantern!",
  },
  "letter.wrong.s": {
    mood: "coach",
    text: "That is s. It makes a quiet snake sound: sssss. We need the closed-lips humming sound: mmmmm.",
  },
  "letter.wrong.t": {
    mood: "coach",
    text: "That is t. It makes a quick tapping sound. We need the long, closed-lips hum: mmmmm.",
  },
  "blend.prompt": {
    mood: "curious",
    text: "Time to cross Blend Bridge. Do not say the letter names. Listen while I stretch their sounds and sweep them together: mmmmm... aaaaa... t. Mmmmm-aaaaa-t. Mat! Which word did you hear?",
  },
  "blend.hint.1": {
    mood: "coach",
    text: "I will make the sound bridge shorter: mmmmm-aaaaa-t. Mat. Tap mat.",
  },
  "blend.hint.2": {
    mood: "coach",
    text: "The first sound hums, the middle opens wide, and the last sound taps: mmmmm-aaaaa-t. The word is mat.",
  },
  "blend.correct": {
    mood: "celebrate",
    text: "Mat! You kept every sound touching all the way across the bridge. That is real reading!",
  },
  "blend.wrong.sun": {
    mood: "coach",
    text: "Sun begins with a snake sound. Our word begins with the humming sound, mmmmm. Try the word that begins with m.",
  },
  "blend.wrong.cat": {
    mood: "coach",
    text: "Cat begins with a sharp kuh sound. Our word begins with mmmmm. Try the word that begins with m.",
  },
  "word.prompt": {
    mood: "curious",
    text: "We have the word sat. Let us grow it into sit by changing only the middle sound. Sat. Sit. Which vowel belongs in the middle of sit?",
  },
  "word.hint.1": {
    mood: "coach",
    text: "Say sit very slowly: sss... ih... t. The quick middle sound is ih. Which vowel can make ih?",
  },
  "word.hint.2": {
    mood: "coach",
    text: "The middle of sit uses lowercase i. Plant i between s and t.",
  },
  "word.correct": {
    mood: "celebrate",
    text: "Sss-ih-t. Sit! You changed one tiny sound and grew a whole new word!",
  },
  "word.wrong.a": {
    mood: "coach",
    text: "A would keep our old word, sat. We are growing sit. Listen for the quick ih sound in the middle.",
  },
  "word.wrong.o": {
    mood: "coach",
    text: "O would grow the word sot. We need sit, with a quick ih sound in the middle.",
  },
  "story.prompt": {
    mood: "story",
    text: "The curtains are opening! Listen, then read it with me. Sam sat. A cat sat with Sam. Now the story question: who sat with Sam?",
  },
  "story.hint.1": {
    mood: "coach",
    text: "Let us look at the second sentence: A cat sat with Sam. Who did it name?",
  },
  "story.hint.2": {
    mood: "coach",
    text: "The story says, A cat sat with Sam. Tap the cat.",
  },
  "story.correct": {
    mood: "celebrate",
    text: "Yes, the cat sat with Sam! You remembered what the story meant. Take a bow, reader!",
  },
  "story.wrong.dog": {
    mood: "coach",
    text: "A dog would be fun, but our story never named one. Listen again for the animal in the second sentence.",
  },
  "story.wrong.fox": {
    mood: "coach",
    text: "I am cheering from the audience, but I was not in the story. Listen again for the animal beside Sam.",
  },
  complete: {
    mood: "celebrate",
    text: "You did it! Five reading stops, one tiny story, and a brand-new moonflower seed. Your garden grew because you listened, tried again, and kept every sound moving. High five!",
  },
};

export function getVoiceLine(lineId: string) {
  return VOICE_LINES[lineId];
}
