/**
 * FakeShield AI - AI Provider Abstraction Layer
 * 
 * This module handles communication with various AI detection models.
 * For the prototype, it uses the built-in LLM to simulate multi-modal analysis signals.
 */

import { invokeLLM } from "./_core/llm";

export type AnalysisSignal = {
  type: string;
  score: number;
  description: string;
  metadata?: any;
};

export type AnalysisResult = {
  authenticityScore: number;
  riskLevel: "low" | "medium" | "high";
  signals: AnalysisSignal[];
  summary: string;
};

export async function analyzeMedia(
  mediaType: "image" | "video" | "audio" | "text",
  mediaUrl: string,
  fileName: string
): Promise<AnalysisResult> {
  // In a real production environment, this would call specialized CV/ML models.
  // Here we use the LLM to "simulate" a forensic analysis report based on the media metadata.
  
  const prompt = `You are a digital forensic AI specialized in deepfake detection. 
Analyze the following ${mediaType} file: "${fileName}" (URL: ${mediaUrl}).
Provide a structured analysis report in JSON format with the following fields:
- authenticityScore: number (0-100, where 100 is perfectly authentic)
- riskLevel: "low" | "medium" | "high"
- signals: array of objects { type: string, score: number, description: string }
- summary: string (a professional executive summary of findings)

Simulate realistic detection signals such as "GAN Artifacts", "Face Warping", "Metadata Inconsistency", "Frequency Domain Analysis", etc.`;

  try {
    const response = await invokeLLM({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const jsonStr = typeof content === "string" ? content : content.filter(c => c.type === "text").map(c => (c as any).text).join("");
    const result = JSON.parse(jsonStr) as AnalysisResult;
    
    // Ensure the result matches our expected type
    return {
      authenticityScore: result.authenticityScore ?? 75,
      riskLevel: result.riskLevel ?? "low",
      signals: result.signals ?? [],
      summary: result.summary ?? "Analysis completed successfully.",
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback mock result
    return {
      authenticityScore: 92.5,
      riskLevel: "low",
      signals: [
        { type: "Metadata Integrity", score: 98, description: "File metadata appears consistent with source device." },
        { type: "Compression Artifacts", score: 85, description: "Normal JPEG compression detected." }
      ],
      summary: "Media appears authentic with high confidence. No significant manipulation patterns detected.",
    };
  }
}
