import { spawn } from "child_process";
import { AnalysisResult } from "./ai";
import { storagePut } from "./storage";
import fs from "fs/promises";
import path from "path";

export async function generateAnalysisReport(
  jobId: number,
  mediaName: string,
  result: AnalysisResult
): Promise<{ key: string; url: string }> {
  const tempPath = path.join("/tmp", `FS-RPT-${jobId}-${Date.now()}.pdf`);
  
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [
      path.join(__dirname, "generate_pdf.py"),
      jobId.toString(),
      mediaName,
      JSON.stringify(result),
      tempPath
    ]);

    pythonProcess.on("close", async (code) => {
      if (code !== 0) {
        return reject(new Error(`Python PDF generation failed with code ${code}`));
      }

      try {
        const buffer = await fs.readFile(tempPath);
        const storageKey = `reports/FS-RPT-${jobId}.pdf`;
        const upload = await storagePut(storageKey, buffer, "application/pdf");
        
        // Clean up temp file
        await fs.unlink(tempPath);
        
        resolve(upload);
      } catch (err) {
        reject(err);
      }
    });

    pythonProcess.on("error", reject);
  });
}
