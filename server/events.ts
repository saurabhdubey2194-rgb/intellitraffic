import { EventEmitter } from "events";
import { Request, Response } from "express";

const eventEmitter = new EventEmitter();

export function emitAnalysisUpdate(userId: number, data: any) {
  eventEmitter.emit(`analysis:${userId}`, data);
}

export function emitNotification(userId: number, data: any) {
  eventEmitter.emit(`notification:${userId}`, data);
}

export function sseHandler(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const analysisListener = (data: any) => {
    res.write(`event: analysis_update\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const notificationListener = (data: any) => {
    res.write(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
  };

  eventEmitter.on(`analysis:${userId}`, analysisListener);
  eventEmitter.on(`notification:${userId}`, notificationListener);

  req.on("close", () => {
    eventEmitter.off(`analysis:${userId}`, analysisListener);
    eventEmitter.off(`notification:${userId}`, notificationListener);
  });
}
