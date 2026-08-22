/**
 * FakeShield AI - Forensic Provider Abstraction
 * 
 * Defines the adapter pattern for pluggable AI analysis engines.
 */

import { AnalysisResult } from "./ai";

export interface AIProvider {
  name: string;
  version: string;
  analyze(mediaType: string, mediaUrl: string, fileName: string): Promise<AnalysisResult>;
}

export class LLMForensicProvider implements AIProvider {
  name = "FakeShield-V2-LLM";
  version = "2.4.0";
  
  async analyze(mediaType: string, mediaUrl: string, fileName: string): Promise<AnalysisResult> {
    const { analyzeMedia } = await import("./ai");
    return analyzeMedia(mediaType as any, mediaUrl, fileName);
  }
}

export class HeuristicForensicProvider implements AIProvider {
  name = "FakeShield-V2-Heuristic";
  version = "1.0.0";
  
  async analyze(mediaType: string, mediaUrl: string, fileName: string): Promise<AnalysisResult> {
    return {
      authenticityScore: 50,
      riskLevel: "moderate",
      summary: "Heuristic scan suggests baseline inconsistencies. Deep neural scan recommended.",
      signals: [{ type: "Heuristic", score: 50, description: "Static rule-based detection." }],
      evidence: [],
      recommendations: ["Upgrade to neural scan for higher precision."]
    };
  }
}

export class AIForensicManager {
  private static instance: AIForensicManager;
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string = "llm";

  private constructor() {
    this.registerProvider("llm", new LLMForensicProvider());
    this.registerProvider("heuristic", new HeuristicForensicProvider());
  }

  static getInstance(): AIForensicManager {
    if (!AIForensicManager.instance) {
      AIForensicManager.instance = new AIForensicManager();
    }
    return AIForensicManager.instance;
  }

  registerProvider(id: string, provider: AIProvider) {
    this.providers.set(id, provider);
  }

  setActiveProvider(id: string) {
    if (!this.providers.has(id)) throw new Error(`Provider ${id} not found`);
    this.activeProvider = id;
  }

  async analyze(mediaType: string, mediaUrl: string, fileName: string): Promise<AnalysisResult> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) throw new Error("No active AI provider");
    return provider.analyze(mediaType, mediaUrl, fileName);
  }
}
