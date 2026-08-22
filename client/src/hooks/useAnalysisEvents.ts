import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useAnalysisEvents() {
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.addEventListener("analysis_update", (event) => {
      const data = JSON.parse(event.data);
      setLastUpdate(data);
      
      if (data.status === "completed") {
        toast.success("Analysis Completed", {
          description: `Job #${data.jobId} is ready for review.`,
        });
      } else if (data.status === "failed") {
        toast.error("Analysis Failed", {
          description: `Job #${data.jobId} encountered an error: ${data.error}`,
        });
      }
    });

    eventSource.addEventListener("notification", (event) => {
      const data = JSON.parse(event.data);
      toast(data.title, {
        description: data.message,
      });
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection failed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return lastUpdate;
}
