/**
 * FakeShield AI - Mock Analysis Worker
 * 
 * Simulates the asynchronous processing pipeline for media analysis.
 */

import { eq } from "drizzle-orm";
import { analysisJobs, analysisResults, analysisSignals, mediaFiles, notifications } from "../drizzle/schema";
import { getDb } from "./db";
import { analyzeMedia } from "./ai";
import { emitAnalysisUpdate } from "./events";

export async function processJob(jobId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Get job info for userId
    const [jobInfo] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).limit(1);
    
    // 1. Preprocessing
    await db.update(analysisJobs)
      .set({ status: "preprocessing", progress: 20, startedAt: new Date() })
      .where(eq(analysisJobs.id, jobId));
    emitAnalysisUpdate(jobInfo.userId, { jobId, status: "preprocessing", progress: 20, message: "Normalizing media for forensic scan..." });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Analyzing
    await db.update(analysisJobs)
      .set({ status: "analyzing", progress: 50 })
      .where(eq(analysisJobs.id, jobId));
    emitAnalysisUpdate(jobInfo.userId, { jobId, status: "analyzing", progress: 50, message: "AI forensic engine running multi-modal detection..." });

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

    // 7. Create Notification
    const isHighRisk = ['high', 'critical'].includes(analysis.riskLevel);
    await db.insert(notifications).values({
      userId: jobInfo.userId,
      title: isHighRisk ? "⚠️ HIGH RISK DETECTED" : "Analysis Completed",
      message: isHighRisk 
        ? `CRITICAL: Potential deepfake detected in FS-${jobId.toString().padStart(6, '0')}. Risk Level: ${analysis.riskLevel.toUpperCase()}.`
        : `Forensic scan for FS-${jobId.toString().padStart(6, '0')} is ready. Verdict: ${analysis.riskLevel.toUpperCase()} RISK.`,
      type: analysis.riskLevel === 'low' ? 'success' : analysis.riskLevel === 'moderate' ? 'warning' : 'error',
      link: `/analysis/${jobId}`,
    });

    emitAnalysisUpdate(jobInfo.userId, { 
      jobId, 
      status: "completed", 
      progress: 100, 
      message: "Analysis complete. Forensic report generated.",
      riskLevel: analysis.riskLevel,
      authenticityScore: analysis.authenticityScore
    });

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await db.update(analysisJobs)
      .set({ status: "failed", errorMessage: String(error) })
      .where(eq(analysisJobs.id, jobId));
    
    // Attempt to notify user of failure
    try {
      const [jobInfo] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).limit(1);
      if (jobInfo) {
        await db.insert(notifications).values({
          userId: jobInfo.userId,
          title: "❌ Analysis Failed",
          message: `Forensic engine encountered an error while processing FS-${jobId.toString().padStart(6, '0')}.`,
          type: "error",
          link: `/analysis/${jobId}`,
        });
        emitAnalysisUpdate(jobInfo.userId, { jobId, status: "failed", error: String(error) });
      }
    } catch (e) {
      console.error("Failed to emit failure update:", e);
    }
  }
}
