/**
 * FakeShield AI Test Helpers
 */

export function mockAnalysisResult(mediaId: number) {
  return {
    jobId: mediaId,
    authenticityScore: 85.5,
    riskLevel: "low",
    signals: [
      { type: "GAN Detection", score: 12.5, description: "No significant GAN patterns detected." }
    ]
  };
}
