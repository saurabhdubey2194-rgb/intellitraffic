import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileSearch, 
  History, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  MoreVertical,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Video
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const caseId = parseInt(id || "0");
  const utils = trpc.useUtils();

  const { data: caseDetails, isLoading } = trpc.cases.get.useQuery({ caseId });
  const updateStatus = trpc.cases.updateStatus.useMutation({
    onSuccess: () => {
      utils.cases.get.invalidate({ caseId });
      toast.success("Case status updated");
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Case Not Found</h2>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/cases")}>
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cases")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{caseDetails.title}</h1>
            <p className="text-muted-foreground">Case ID: CASE-{new Date(caseDetails.createdAt).getFullYear()}-{caseDetails.id.toString().padStart(3, '0')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Status: <span className="ml-1 capitalize font-bold">{caseDetails.status}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateStatus.mutate({ caseId, status: "open" })}>Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus.mutate({ caseId, status: "closed" })}>Closed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus.mutate({ caseId, status: "archived" })}>Archived</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-blue-600 hover:bg-blue-500">
            <Download className="mr-2 h-4 w-4" />
            Export Case File
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Case Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {caseDetails.description || "No description provided for this investigation."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Forensic Evidence</CardTitle>
                <CardDescription>Media files linked to this investigation.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/analyze")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Evidence
              </Button>
            </CardHeader>
            <CardContent>
              {caseDetails.evidence.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-xl border-border/40">
                  <FileSearch className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No evidence linked yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {caseDetails.evidence.map((item: any) => (
                    <div key={item.evidence.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-accent/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          {item.media.type === 'video' ? <Video className="h-6 w-6 text-purple-500" /> : <ImageIcon className="h-6 w-6 text-blue-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.media.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            Added on {new Date(item.evidence.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/analysis/${item.media.id}`)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Investigation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Created" value={new Date(caseDetails.createdAt).toLocaleString()} />
              <DetailRow label="Last Updated" value={new Date(caseDetails.updatedAt).toLocaleString()} />
              <DetailRow label="Evidence Count" value={caseDetails.evidence.length.toString()} />
              <DetailRow label="Lead Investigator" value="You" />
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-blue-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Security Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This case file is encrypted and audit-logged. Any access or modification is recorded for compliance purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between text-xs py-2 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ImageIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
