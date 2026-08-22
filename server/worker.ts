/**
 * FakeShield AI - Mock Analysis Worker
 * 
 * Simulates the asynchronous processing pipeline for media analysis.
 */

import { eq } from "drizzle-orm";
import { analysisJobs, analysisResults, analysisSignals, mediaFiles } from "../drizzle/schema";
import { getDb } from "./db";
import { analyzeMedia } from "./ai";

export async function processJob(jobId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // 1. Update status to Preprocessing
    await db.update(analysisJobs)
      .set({ status: "preprocessing", progress: 20, startedAt: new Date() })
      .where(eq(analysisJobs.id, jobId));
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Update status to Analyzing
    await db.update(analysisJobs)
      .set({ status: "analyzing", progress: 50 })
      .where(eq(analysisJobs.id, jobId));

    // Get media info
    const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).limit(1);
    const [media] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, job.mediaId)).limit(1);

    // 3. Call AI Analysis Engine
    const analysis = await analyzeMedia(media.type, media.url, media.originalName);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Save Results
    const [result] = await db.insert(analysisResults).values({
      jobId,
      mediaId: media.id,
      authenticityScore: analysis.authenticityScore,
      manipulationProbability: 100 - analysis.authenticityScore,
      riskLevel: analysis.riskLevel,
      confidence: 85 + Math.random() * 10,
      modelVersion: "FakeShield-V2-Core",
      summary: analysis.summary,
    });

    // 5. Save Signals
    for (const signal of analysis.signals) {
      await db.insert(analysisSignals).values({
        resultId: result.insertId,
        type: signal.type,
        score: signal.score,
        description: signal.description,
      });
    }

    // 6. Complete Job
    await db.update(analysisJobs)
      .set({ status: "completed", progress: 100, completedAt: new Date() })
      .where(eq(analysisJobs.id, jobId));

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await db.update(analysisJobs)
      .set({ status: "failed", errorMessage: String(error) })
      .where(eq(analysisJobs.id, jobId));
  }
}
