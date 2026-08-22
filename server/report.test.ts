import { describe, it, expect, vi } from "vitest";
import { generateAnalysisReport } from "./reports";
import { storagePut } from "./storage";

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://test-url.com/report.pdf" }),
}));

describe("FakeShield AI Report Generation", () => {
  it("should generate a PDF report and upload to storage", async () => {
    const mockResult = {
      authenticityScore: 92,
      riskLevel: "low" as const,
      summary: "This is a test forensic summary for deepfake detection.",
      signals: [
        { type: "GAN Trace", score: 10, description: "No artifacts found." },
        { type: "Facial Consistency", score: 95, description: "Biometrics appear natural." }
      ]
    };

    const report = await generateAnalysisReport(123, "test-video.mp4", mockResult);
    
    expect(report).toBeDefined();
    expect(report.url).toContain("https://test-url.com/report.pdf");
    expect(storagePut).toHaveBeenCalled();
    
    const [key, buffer, mime] = (storagePut as any).mock.calls[0];
    expect(key).toContain("reports/FS-RPT-123.pdf");
    expect(mime).toBe("application/pdf");
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
