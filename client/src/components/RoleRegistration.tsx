import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Ambulance,
  Hospital,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Shown once a signed-in user has role 'user'/'admin'/'public' without profile:
 * choose a role and submit the registration form. Public activates instantly,
 * others go to verification pending.
 */
export default function RoleRegistration({
  open,
  onDone,
}: {
  open: boolean;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [role, setRole] = useState<
    "public" | "ambulance" | "police" | "hospital" | null
  >(() => {
    // OAuth handoff: if the user started at /signin and picked a role + ID,
    // resume that selection here instead of making them choose again.
    try {
      const pending = localStorage.getItem("it.pendingRole");
      if (pending === "ambulance" || pending === "police" || pending === "hospital") return pending;
    } catch {
      /* storage unavailable */
    }
    return null;
  });

  return (
    <Dialog open={open} onOpenChange={open => !open && onDone()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose your role</DialogTitle>
              <DialogDescription>
                Welcome, {user?.name || "friend"}. Tell us how you'll use
                IntelliTraffic — you can always request a different role later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { r: "public", icon: User, t: "Public", d: "Traffic, routes, reports" },
                  { r: "ambulance", icon: Ambulance, t: "Ambulance", d: "Emergency corridors" },
                  { r: "police", icon: Shield, t: "Police", d: "Verification & command" },
                  { r: "hospital", icon: Hospital, t: "Hospital", d: "Incoming emergencies" },
                ] as const
              ).map(({ r, icon: Icon, t, d }) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setStep("form");
                  }}
                  className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-card p-4 text-left hover:border-emerald-400/40 hover:bg-accent transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <RoleForm role={role!} onCancel={() => { setStep("choose"); setRole(null); }} onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({
  role,
  onCancel,
  onDone,
}: {
  role: "public" | "ambulance" | "police" | "hospital";
  onCancel: () => void;
  onDone: () => void;
}) {
  const register = trpc.auth.registerRoleProfile.useMutation({
    onSuccess: data => {
      toast.success(
        role === "public"
          ? "Public account activated. Welcome to IntelliTraffic!"
          : "Registration submitted. Your account is pending verification — a host admin will review your details.",
      );
      onDone();
    },
    onError: err => toast.error(err.message),
  });

  const [form, setForm] = useState(() => {
    // OAuth handoff: pre-fill the field matching the sign-in ID value
    // (registration no. for ambulances, officer ID for police, reg. no. for hospitals).
    let handoffId = "";
    try {
      handoffId = localStorage.getItem("it.pendingId") ?? "";
      localStorage.removeItem("it.pendingRole");
      localStorage.removeItem("it.pendingId");
    } catch {
      /* storage unavailable */
    }
    return {
    phone: "",
    city: "",
    district: "New Delhi",
    state: "Uttar Pradesh",
    handoffId,

    // ambulance
    driverName: "",
    registrationNumber: "",
    driverLicenceNumber: "",
    permitNumber: "",
    insuranceNumber: "",
    hospitalAssociation: "",
    hospitalId: "",
    operatingDistrict: "Noida",
    ambulanceType: "basic",
    // police
    stationName: "",
    officerName: "",
    officerId: "",
    designation: "",
    // hospital
    hospitalName: "",
    hospitalRegNumber: "",
    contactName: "",
    contactNumber: "",
    emergencyContact: "",
    address: "",
        notes: "",
    docs: [] as { docType: string; file: File; dataUrl: string; sizeBytes: number }[],
    policeDoc: null as { docType: string; file: File; dataUrl: string; sizeBytes: number } | null,
    hospitalDoc: null as { docType: string; file: File; dataUrl: string; sizeBytes: number } | null,
  };
});
  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Apply the handoff ID to the matching field on first mount if present.
  const appliedHandoff = useRef(false);
  useEffect(() => {
    if (appliedHandoff.current || !form.handoffId) return;
    appliedHandoff.current = true;
    const map: Record<string, keyof typeof form> = {
      ambulance: "registrationNumber",
      police: "officerId",
      hospital: "hospitalRegNumber",
    };
    const field = map[role];
    if (field) setForm(f => ({ ...f, [field]: form.handoffId }));
  }, [role, form.handoffId]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {role === "public"
            ? "Public account details"
            : role === "ambulance"
              ? "Ambulance registration"
              : role === "police"
                ? "Police officer registration"
                : "Hospital registration"}
        </DialogTitle>
        <DialogDescription>
          {role === "public"
            ? "Instant activation for public accounts."
            : "Your account will be verified by a platform administrator before activation."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              placeholder="+91 98xxx xxxxx"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">City</Label>
            <Input
              placeholder="Delhi"
              value={form.city}
              onChange={set("city")}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">District</Label>
            <Input value={form.district} onChange={set("district")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State</Label>
            <Input value={form.state} onChange={set("state")} />
          </div>
        </div>

        {role === "ambulance" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Driver Name</Label>
              <Input value={form.driverName} onChange={set("driverName")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ambulance Registration No.</Label>
                <Input placeholder="UP78 AB 1234" value={form.registrationNumber} onChange={set("registrationNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Driver Licence No.</Label>
                <Input value={form.driverLicenceNumber} onChange={set("driverLicenceNumber")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Permit Number</Label>
                <Input value={form.permitNumber} onChange={set("permitNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Insurance Number</Label>
                <Input value={form.insuranceNumber} onChange={set("insuranceNumber")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hospital Association</Label>
                <Input value={form.hospitalAssociation} onChange={set("hospitalAssociation")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Operating District</Label>
                <Input value={form.operatingDistrict} onChange={set("operatingDistrict")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ambulance Type</Label>
                <Select
                  value={form.ambulanceType}
                  onValueChange={v => setForm(f => ({ ...f, ambulanceType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ambulance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Life Support</SelectItem>
                    <SelectItem value="advanced">Advanced Life Support</SelectItem>
                    <SelectItem value="transport">Patient Transport</SelectItem>
                    <SelectItem value="emergency_response">Emergency Response</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">&nbsp;</Label>
                <div className="pt-2 text-xs text-muted-foreground">
                  Documents are stored securely and pending admin review.
                </div>
              </div>
            </div>
            <DocumentUpload
              label="Supporting documents (RC, permit, licence, insurance)"
              maxFiles={6}
              files={form.docs}
              allowed={["rc", "ambulance_permit", "driver_license", "insurance", "hospital_authorization"]}
              onChange={docs => setForm(f => ({ ...f, docs }))}
            />
          </>
        )}

        {role === "police" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Police Station Name</Label>
              <Input placeholder="e.g. Connaught Place PS, New Delhi" value={form.stationName} onChange={set("stationName")} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Officer Name</Label>
                <Input placeholder="e.g. S.I. Rakesh Kumar" value={form.officerName} onChange={set("officerName")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Officer ID</Label>
                <Input placeholder="e.g. DL/NCR/12345" value={form.officerId} onChange={set("officerId")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Designation</Label>
                <Input placeholder="Inspector" value={form.designation} onChange={set("designation")} />
              </div>
            </div>
            <DocumentUpload
              label="ID proof / authorization letter"
              maxFiles={1}
              files={form.policeDoc ? [form.policeDoc] : []}
              allowed={["police_id_card", "police_authorization"]}
              onChange={docs => setForm(f => ({ ...f, policeDoc: docs[0] ?? null }))}
            />
          </>
        )}

        {role === "hospital" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Hospital Name</Label>
              <Input value={form.hospitalName} onChange={set("hospitalName")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Registration Number</Label>
                <Input value={form.hospitalRegNumber} onChange={set("hospitalRegNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Emergency Contact</Label>
                <Input value={form.emergencyContact} onChange={set("emergencyContact")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contact Person Name</Label>
                <Input placeholder="e.g. Dr. Priya Sharma" value={form.contactName} onChange={set("contactName")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Contact Number</Label>
                <Input placeholder="+91 98xxx xxxxx" value={form.contactNumber} onChange={set("contactNumber")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Textarea value={form.address} onChange={set("address")} rows={2} />
            </div>
            <DocumentUpload
              label="Hospital license / registration certificate"
              maxFiles={1}
              files={form.hospitalDoc ? [form.hospitalDoc] : []}
              allowed={["hospital_license", "hospital_registration"]}
              onChange={docs => setForm(f => ({ ...f, hospitalDoc: docs[0] ?? null }))}
            />
          </>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea
            placeholder="Any additional information for verification..."
            value={form.notes}
            onChange={set("notes")}
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button
          onClick={() => {
            const payload = {
              role,
              phone: form.phone,
              city: form.city,
              district: form.district,
              state: form.state,
              notes: role === "public" ? form.notes : undefined,
              ambulance:
                role === "ambulance"
                  ? {
                      driverName: form.driverName,
                      registrationNumber: form.registrationNumber,
                      driverLicenceNumber: form.driverLicenceNumber || undefined,
                      permitNumber: form.permitNumber || undefined,
                      insuranceNumber: form.insuranceNumber || undefined,
                      hospitalAssociation: form.hospitalAssociation || undefined,
                      hospitalId: form.hospitalId ? Number(form.hospitalId) : undefined,
                      operatingDistrict: form.operatingDistrict || undefined,
                      ambulanceType: form.ambulanceType as "basic",
                      docs: form.docs.map(d => ({
                        docType: d.docType as "rc",
                        fileName: d.file.name,
                        base64: d.dataUrl.split(",")[1] ?? "",
                        mimeType: d.file.type,
                        sizeBytes: d.sizeBytes,
                      })),
                    }
                  : undefined,
              hospital:
                role === "hospital"
                  ? {
                      hospitalName: form.hospitalName,
                      registrationNumber: form.hospitalRegNumber || undefined,
                      contactName: form.contactName || undefined,
                      contactNumber: form.contactNumber || undefined,
                      emergencyContact: form.emergencyContact || undefined,
                      address: form.address || undefined,
                      district: form.district,
                      state: form.state,
                      doc: form.hospitalDoc
                        ? {
                            docType: form.hospitalDoc.docType as "hospital_license",
                            fileName: form.hospitalDoc.file.name,
                            base64: form.hospitalDoc.dataUrl.split(",")[1] ?? "",
                            mimeType: form.hospitalDoc.file.type,
                            sizeBytes: form.hospitalDoc.sizeBytes,
                          }
                        : undefined,
                    }
                  : undefined,
              police:
                role === "police"
                  ? {
                      stationName: form.stationName,
                      officerName: form.officerName,
                      officerId: form.officerId || undefined,
                      designation: form.designation || undefined,
                      district: form.district,
                      state: form.state,
                      doc: form.policeDoc
                        ? {
                            docType: form.policeDoc.docType as "police_id_card",
                            fileName: form.policeDoc.file.name,
                            base64: form.policeDoc.dataUrl.split(",")[1] ?? "",
                            mimeType: form.policeDoc.file.type,
                            sizeBytes: form.policeDoc.sizeBytes,
                          }
                        : undefined,
                    }
                  : undefined,
            };
            register.mutate(payload);
          }}
          disabled={register.isPending}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
        >
          {register.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : null}
          {role === "public" ? "Activate Account" : "Submit for Verification"}
        </Button>
      </div>
    </>
  );
}


const DOC_LABELS: Record<string, string> = {
  rc: "Vehicle RC",
  ambulance_permit: "Ambulance Permit",
  driver_license: "Driver Licence",
  insurance: "Insurance",
  hospital_authorization: "Hospital Authorization",
  hospital_license: "Hospital License",
  hospital_registration: "Hospital Registration",
  police_id_card: "Police ID Card",
  police_authorization: "Police Authorization",
};

function DocumentUpload({
  label,
  maxFiles,
  files,
  allowed,
  onChange,
}: {
  label: string;
  maxFiles: number;
  files: { docType: string; file: File; dataUrl: string; sizeBytes: number }[];
  allowed: string[];
  onChange: (files: { docType: string; file: File; dataUrl: string; sizeBytes: number }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_BYTES = 2 * 1024 * 1024;

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} document${maxFiles > 1 ? "s" : ""} allowed`);
        break;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 2MB — try a smaller file`);
        continue;
      }
      const docType = allowed[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        onChange([
          ...next,
          { docType, file, dataUrl, sizeBytes: file.size },
        ]);
      };
      reader.readAsDataURL(file);
      next.push({ docType, file, dataUrl: "", sizeBytes: file.size } as never);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          {files.length > 0 ? "Add another" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={e => {
            handleFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        {files.map((d, i) => (
          <Badge
            key={`${d.file.name}-${i}`}
            variant="outline"
            className="flex items-center gap-1 py-1 text-xs bg-field"
          >
            <FileText className="h-3 w-3" />
            {DOC_LABELS[d.docType] ?? d.docType}: {d.file.name} (
            {Math.round(d.sizeBytes / 1024)}KB)
            <button
              type="button"
              aria-label={`Remove ${d.file.name}`}
              onClick={() => onChange(files.filter((_, j) => j !== i))}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        PDF, JPG or PNG up to 2MB each. Documents stay pending until an admin reviews them.
      </p>
    </div>
  );
}
