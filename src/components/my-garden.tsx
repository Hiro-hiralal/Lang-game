"use client";

import { motion } from "motion/react";
import { ArrowLeft, Flower2, Sparkles } from "lucide-react";
import { GARDEN_PLANTS } from "@/lib/world-data";

interface MyGardenProps {
  seeds: number;
  plantedSeedIds: string[];
  onBack: () => void;
  onPlant: (plantId: string, cost: number) => void;
}

export function MyGarden({
  seeds,
  plantedSeedIds,
  onBack,
  onPlant,
}: MyGardenProps) {
  return (
    <main className="my-garden">
      <section className="collection-header collection-header--garden">
        <button className="back-button" onClick={onBack}><ArrowLeft /> Back to world</button>
        <span className="section-kicker">A garden you can change</span>
        <h1>Plant every brave try.</h1>
        <p>Adventures earn glowing seeds. Choose what grows in each plot.</p>
        <div className="garden-seed-bank"><Sparkles /> <strong>{seeds}</strong> seeds ready to plant</div>
      </section>

      <section className="garden-plots">
        {GARDEN_PLANTS.map((plant, index) => {
          const planted = plantedSeedIds.includes(plant.id);
          const affordable = seeds >= plant.cost;
          return (
            <motion.article
              className={`garden-plot ${planted ? "garden-plot--planted" : ""}`}
              key={plant.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="garden-plot__sky">
                {planted ? (
                  <motion.span
                    animate={{ y: [0, -7, 0], rotate: [-2, 2, -2] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.12 }}
                  >
                    {plant.icon}
                  </motion.span>
                ) : (
                  <span className="garden-plot__empty"><Flower2 /></span>
                )}
              </div>
              <div className="garden-plot__soil" />
              <h2>{plant.name}</h2>
              {planted ? (
                <p>Growing beautifully</p>
              ) : (
                <button
                  onClick={() => onPlant(plant.id, plant.cost)}
                  disabled={!affordable}
                >
                  {affordable ? `Plant · ${plant.cost} seed${plant.cost > 1 ? "s" : ""}` : "Earn more seeds"}
                </button>
              )}
            </motion.article>
          );
        })}
      </section>
    </main>
  );
}
