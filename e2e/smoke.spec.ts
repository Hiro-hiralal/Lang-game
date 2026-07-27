import { expect, test, type Page } from "@playwright/test";

/**
 * Smoke tests against the production build.
 *
 * These exist for the things jsdom cannot tell you: that the app boots, that a
 * child can actually get from the welcome screen to a finished adventure, and
 * that the pointer-driven activities respond to a real pointer. Two bugs in
 * this codebase were only visible in a browser — a pulsing tap target that
 * moved under the finger, and a caption painted over by a background layer.
 */

/** Unlocks the world so a test can reach any chapter directly. */
async function seedProgress(page: Page, overrides: Record<string, unknown> = {}) {
  await page.goto("/");
  await page.evaluate((extra) => {
    window.localStorage.setItem(
      "story-sprouts-progress-v2",
      JSON.stringify({
        version: 2,
        progress: {
          childName: "explorer",
          sessionsCompleted: 0,
          seeds: 10,
          streak: 0,
          masteredLetters: [],
          masteredWords: [],
          gardenLevel: 0,
          soundOn: false,
          reducedMotion: true,
          lastPlayed: null,
          completedAdventureIds: [],
          plantedSeedIds: [],
          unlockedStickerIds: [],
          readStoryIds: [],
          totalStars: 0,
          dailyQuestDate: null,
          ...(extra as object),
        },
      }),
    );
  }, overrides);
  await page.reload();
}

test("a brand-new profile starts genuinely empty", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  // The showcase fixture used to ship to every new player.
  await expect(page.getByText("Mia")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Explore my world/i })).toBeVisible();

  await page.getByRole("button", { name: /Explore my world/i }).click();
  await expect(page.getByText("0 / 20 quests")).toBeVisible();
});

test("a child can finish an adventure and see the world change", async ({
  page,
}) => {
  await seedProgress(page);
  await page.getByRole("button", { name: /Explore my world/i }).click();
  await page.getByRole("button", { name: /Echo Meadow/i }).first().click();

  await page.locator(".adventure-card").first().getByRole("button").click();
  await expect(page.getByText(/Challenge 1 of/)).toBeVisible();

  // Three rhyme items, each a choice between pictures.
  for (let item = 0; item < 3; item += 1) {
    const cards = page.locator(".answer-card");
    await expect(cards.first()).toBeVisible();

    // Try each option until one is accepted; the answer is not on screen.
    const count = await cards.count();
    for (let choice = 0; choice < count; choice += 1) {
      await cards.nth(choice).click();
      if (await page.locator(".answer-card--correct").count()) break;
      await page.waitForTimeout(1800);
    }

    const next = page.getByRole("button", { name: /Next stop|Claim my treasure/i });
    await expect(next).toBeVisible();
    await next.click();
  }

  await expect(page.getByText(/Chapter complete/i)).toBeVisible();
  await page.getByRole("button", { name: /See my garden grow/i }).click();
  await expect(page.getByText(/seeds ready to plant/i)).toBeVisible();
});

test("the letter lantern never shows its answer before the child answers", async ({
  page,
}) => {
  await seedProgress(page, { completedAdventureIds: ["moon-mouse"] });
  await page.getByRole("button", { name: /Explore my world/i }).click();
  await page.getByRole("button", { name: /Lantern Grove/i }).first().click();

  // Chapter 2 is a letter-recognition item.
  await page.locator(".adventure-card").nth(1).getByRole("button").click();

  const lantern = page.locator(".letter-lantern");
  await expect(lantern).toBeVisible();
  await expect(lantern).toHaveClass(/letter-lantern--dark/);
  await expect(lantern).toHaveText("?");
});

test("a blend sweep responds to a real pointer dragged across the stones", async ({
  page,
}) => {
  await seedProgress(page);
  await page.getByRole("button", { name: /Explore my world/i }).click();
  await page.getByRole("button", { name: /Blend Brook/i }).first().click();
  await page.locator(".adventure-card").first().getByRole("button").click();

  const stones = page.locator(".blend-stone");
  await expect(stones).toHaveCount(3);

  const first = await stones.nth(0).boundingBox();
  await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2);
  await page.mouse.down();
  for (let index = 0; index < 3; index += 1) {
    const box = await stones.nth(index).boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2, {
      steps: 12,
    });
  }
  await page.mouse.up();

  await expect(page.locator(".bridge-visual__caption")).toContainText(
    /bridge is joined/i,
  );
});

test("a wrong answer does not remove the option", async ({ page }) => {
  await seedProgress(page);
  await page.getByRole("button", { name: /Explore my world/i }).click();
  await page.getByRole("button", { name: /Echo Meadow/i }).first().click();
  await page.locator(".adventure-card").first().getByRole("button").click();

  const cards = page.locator(".answer-card");
  const before = await cards.count();

  // Find a wrong one and click it.
  for (let index = 0; index < before; index += 1) {
    await cards.nth(index).click();
    if (!(await page.locator(".answer-card--correct").count())) break;
    return; // Landed on the answer first time; nothing to assert here.
  }

  await page.waitForTimeout(1900);
  // Elimination used to guarantee a win in two taps.
  await expect(cards).toHaveCount(before);
  for (let index = 0; index < before; index += 1) {
    await expect(cards.nth(index)).toBeEnabled();
  }
});

test("the grown-up page reports nothing when nothing has happened", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: /Explore my world/i }).click();
  await page.getByRole("button", { name: /Open grown-up garden/i }).click();

  await expect(page.getByText(/No adventures yet/i)).toBeVisible();
  await expect(page.getByText(/Nothing practised yet/i)).toBeVisible();
  // Never a fabricated percentage.
  await expect(page.getByText(/Not enough practice yet to say/i)).toBeVisible();
});

test("the game is fully playable with narration unavailable", async ({ page }) => {
  // Every narration request fails: the no-audio path must still be complete.
  await page.route("**/api/narrate**", (route) => route.abort());

  await seedProgress(page);
  await page.getByRole("button", { name: /Explore my world/i }).click();
  await page.getByRole("button", { name: /Echo Meadow/i }).first().click();
  await page.locator(".adventure-card").first().getByRole("button").click();

  // Instruction, Pip's prompt and the options are all on screen.
  await expect(page.locator(".activity-shell__top h1")).toBeVisible();
  await expect(page.locator(".pip-guide__bubble p")).not.toBeEmpty();
  await expect(page.locator(".answer-card").first()).toBeVisible();
});
