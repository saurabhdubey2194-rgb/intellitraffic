/**
 * Choose Access Type — public page for creating role access.
 *
 * Per brief: after creating an account, the user picks how they want to use
 * IntelliTraffic. Police / Hospital / Ambulance selection opens a registration
 * form with real document uploads and leaves the account in PENDING
 * verification; Public access activates instantly.
 *
 * Access control: signing up does NOT grant any role. Only host admin
 * verification promotes the account, enforced server-side via
 * registerRoleProfile (verifiedProcedure).
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Ambulance,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Hospital,
  Loader2,
  Radio,
  Shield,
  TrafficCone,
  X,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type RoleKey = "public" | "ambulance" | "police" | "hospital";

const ROLE_META: Record<Exclude<RoleKey, "public">, { title: string; desc: string; icon: typeof Shield; color: string; badge: string }> = {
  ambulance: {
    title: "Ambulance Driver",
    desc: "Request emergency corridors, get signal preemption and route priority.",
    icon: Ambulance,
    color: "text-red-400",
    badge: "bg-red-500/10 border-red-400/30 text-red-300",
  },
  police: {
    title: "Police Officer",
    desc: "Verify emergency requests, manage corridors and dispatch.",
    icon: TrafficCone,
    color: "text-sky-400",
    badge: "bg-sky-500/10 border-sky-400/30 text-sky-300",
  },
  hospital: {
    title: "Hospital Staff",
    desc: "Receive incoming emergencies and update bed availability.",
    icon: Hospital,
    color: "text-emerald-400",
    badge: "bg-emerald-500/10 border-emerald-400/30 text-emerald-300",
  },
};

interface Doc {
  docType: string;
  file: File;
  dataUrl: string;
  sizeBytes: number;
}

interface FormState {
  phone: string;
  city: string;
  district: string;
  state: string;

  driverName: string;
  registrationNumber: string;
  driverLicenceNumber: string;
  permitNumber: string;
  insuranceNumber: string;
  hospitalAssociation: string;
  operatingDistrict: string;
  ambulanceType: string;

  stationName: string;
  officerName: string;
  officerId: string;
  designation: string;

  hospitalName: string;
  hospitalRegNumber: string;
  contactName: string;
  contactNumber: string;
  emergencyContact: string;
  address: string;
  notes: string;

  docs: Doc[];
  policeDoc: Doc | null;
  hospitalDoc: Doc | null;
}

const EMPTY_FORM: FormState = {
  phone: "",
  city: "",
  district: "",
  state: "",
  driverName: "",
  registrationNumber: "",
  driverLicenceNumber: "",
  permitNumber: "",
  insuranceNumber: "",
  hospitalAssociation: "",
  operatingDistrict: "",
  ambulanceType: "basic",
  stationName: "",
  officerName: "",
  officerId: "",
  designation: "",
  hospitalName: "",
  hospitalRegNumber: "",
  contactName: "",
  contactNumber: "",
  emergencyContact: "",
  address: "",
  notes: "",
  docs: [],
  policeDoc: null,
  hospitalDoc: null,
};

const DOC_LABELS: Record<string, string> = {
  rc: "Vehicle RC",
  ambulance_permit: "Ambulance Permit",
  driver_license: "Driver Licence",
  insurance: "Insurance Certificate",
  hospital_authorization: "Hospital Authorization",
  police_id_card: "Police ID Card",
  police_authorization: "Authorization Letter",
  hospital_license: "Hospital License",
  hospital_registration: "Registration Certificate",
};

function docToPayload(d: Doc, docType: string, role: "ambulance" | "police" | "hospital") {
  return {
    docType: docType as "rc",
    fileName: d.file.name,
    base64: d.dataUrl.split(",")[1] ?? "",
    mimeType: d.file.type,
    sizeBytes: d.sizeBytes,
  };
}

export default function ChooseAccessType() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [role, setRole] = useState<RoleKey | null>(null);
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY_FORM, docs: [], district: "", state: "" }));
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const register = trpc.auth.registerRoleProfile.useMutation({
    onSuccess: data => {
      setSubmitted(true);
      if (role === "public") {
        toast.success("Public access activated — you can now use IntelliTraffic!");
      } else {
        toast.success(
          "Registration submitted. Your account is pending verification — a host admin will review your details.",
        );
      }
      setTimeout(() => navigate("/map"), 2600);
    },
    onError: err => setServerError(err.message),
  });

  if (loading) return null;

  const isVerified =
    user && user.verificationStatus === "verified" && ["ambulance", "police", "hospital", "user", "admin", "host"].includes(user.role);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/60 bg-[#0b1526]">
        <div className="container flex items-center justify-center gap-3 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/25">
            <Radio className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight">
              Intelli<span className="text-emerald-400">Traffic</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Choose Your Access Type
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-3xl py-10 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(user ? "/dashboard" : "/signin")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {submitted && role && role !== "public" ? (
          <PendingState user={user} role={role} onCheck={() => navigate("/dashboard")} />
        ) : (
          <>
            {!isVerified && user && (
              <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                {user.verificationStatus === "pending"
                  ? `You previously applied as ${user.role}. While a submission is under review, choose an access type only if your review has closed.`
                  : null}
              </div>
            )}

            {role ? (
              <RoleForm
                role={role}
                form={form}
                setForm={setForm}
                serverError={serverError}
                submitting={register.isPending}
                onBack={() => { setRole(null); setServerError(null); setForm({ ...EMPTY_FORM, docs: [], district: "", state: "" }); }}
                onSubmit={() => {
                  const payload: Record<string, unknown> = {
                    role,
                    phone: form.phone || undefined,
                    city: form.city || undefined,
                    district: form.district || undefined,
                    state: form.state || undefined,
                  };
                  if (role === "public") payload.notes = form.notes || undefined;
                  if (role === "ambulance") {
                    payload.ambulance = {
                      driverName: form.driverName,
                      registrationNumber: form.registrationNumber,
                      driverLicenceNumber: form.driverLicenceNumber || undefined,
                      permitNumber: form.permitNumber || undefined,
                      insuranceNumber: form.insuranceNumber || undefined,
                      hospitalAssociation: form.hospitalAssociation || undefined,
                      operatingDistrict: form.operatingDistrict || undefined,
                      ambulanceType: form.ambulanceType,
                      docs: form.docs.map(d => docToPayload(d, d.docType, "ambulance")),
                    };
                  } else if (role === "police") {
                    payload.police = {
                      stationName: form.stationName,
                      officerName: form.officerName,
                      officerId: form.officerId || undefined,
                      designation: form.designation || undefined,
                      district: form.district || undefined,
                      state: form.state || undefined,
                      doc: form.policeDoc ? docToPayload(form.policeDoc, form.policeDoc.docType, "police") : undefined,
                    };
                  } else if (role === "hospital") {
                    payload.hospital = {
                      hospitalName: form.hospitalName,
                      registrationNumber: form.hospitalRegNumber || undefined,
                      contactName: form.contactName || undefined,
                      contactNumber: form.contactNumber || undefined,
                      emergencyContact: form.emergencyContact || undefined,
                      address: form.address || undefined,
                      district: form.district || undefined,
                      state: form.state || undefined,
                      doc: form.hospitalDoc ? docToPayload(form.hospitalDoc, form.hospitalDoc.docType, "hospital") : undefined,
                    };
                  }
                  register.mutate(payload as never);
                }}
              />
            ) : (
              <RolePicker onSelect={r => setRole(r)} signedIn={Boolean(user)} navigate={to => navigate(to)} />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border/60 py-5 text-center text-[11px] text-muted-foreground">
        <p>
          Role selection here does not grant access — authorization requires host
          verification and is enforced on the backend.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------ Role picker ------------------------------ */

function RolePicker({ onSelect, signedIn, navigate }: { onSelect: (r: RoleKey) => void; signedIn: boolean; navigate: (to: string) => void }) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">How do you want to use IntelliTraffic?</h1>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-md mx-auto">
        Select an access type. Ambulance, Police and Hospital access require
        document verification and stay pending until a host admin approves them.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Public — instant */}
        <button
          onClick={() => onSelect("public")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-emerald-400/40 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.25)] active:scale-[0.985]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/25">
            <User className="h-6 w-6 text-emerald-300" aria-hidden="true" />
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold">
              Public User
              <Badge variant="outline" className="border-emerald-400/50 text-emerald-400 text-[10px]">Instant</Badge>
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Explore traffic conditions, live signals, routes, incident reports
              and saved trips. No verification required.
            </p>
          </div>
        </button>

        {(Object.keys(ROLE_META) as Exclude<RoleKey, "public">[]).map(key => {
          const meta = ROLE_META[key];
          const Icon = meta.icon;
          return (
            <button
              key={key}
              onClick={() => {
                if (!signedIn) {
                  localStorage.setItem("it.pendingRole", key);
                  navigate("/signin");
                  return;
                }
                onSelect(key);
              }}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-emerald-400/40 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.25)] active:scale-[0.985]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Icon className={`h-6 w-6 ${meta.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="flex items-center gap-2 font-bold">
                  {meta.title}
                  <Badge variant="outline" className={`${meta.badge} text-[10px]`}>
                    <Clock className="h-2.5 w-2.5 mr-1" /> Pending verification
                  </Badge>
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{meta.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {!useAuth().user && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Need an account first?{" "}
          <button onClick={() => startLogin()} className="text-emerald-400 underline-offset-2 hover:underline">
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}

/* ------------------------------ Role form --------------------------------- */

function RoleForm({
  role,
  form,
  setForm,
  serverError,
  submitting,
  onBack,
  onSubmit,
}: {
  role: RoleKey;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  serverError: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const utils = trpc.useUtils();
  const checkAvailability = trpc.auth.checkAvailability.useQuery(
    {
      email: form.phone ? undefined : undefined,
    },
    { enabled: false },
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const meta = role === "public" ? null : ROLE_META[role];

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = (): string | null => {
    const errors: Record<string, string> = {};
    if (role !== "public") {
      if (form.phone && !/^[\d\s+\-()]{7,16}$/.test(form.phone.trim()))
        errors.phone = "Enter a valid phone number.";
      if (role === "ambulance") {
        if (form.driverName.trim().length < 2) errors.driverName = "Driver name is required.";
        if (form.registrationNumber.trim().length < 5)
          errors.registrationNumber = "Registration number is required (e.g. UP78 AB 1234).";
        if (form.docs.length === 0) errors.docs = "Upload at least one supporting document (RC, permit, licence or insurance).";
      }
      if (role === "police") {
        if (form.stationName.trim().length < 3) errors.stationName = "Station name is required.";
        if (form.officerName.trim().length < 3) errors.officerName = "Officer name is required.";
        if (!form.policeDoc) errors.policeDoc = "Upload your ID card or authorization letter.";
      }
      if (role === "hospital") {
        if (form.hospitalName.trim().length < 3) errors.hospitalName = "Hospital name is required.";
        if (!form.hospitalDoc) errors.hospitalDoc = "Upload the hospital license or registration certificate.";
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return Object.values(errors)[0];
    return null;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">
        {role === "public" ? "Public account" : `Register as ${meta!.title}`}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {role === "public"
          ? "Activate instantly — no documents needed."
          : `Your application will be reviewed by a host admin. You'll be notified when verification completes.`}
      </p>

      <Card className="rounded-2xl border p-5 md:p-7 space-y-5">
        {role !== "public" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone" error={fieldErrors.phone}>
                <Input placeholder="+91 98XXX XXXXX" value={form.phone} onChange={set("phone")} />
              </Field>
              <Field label="City">
                <Input placeholder="e.g. Delhi" value={form.city} onChange={set("city")} />
              </Field>
              <Field label="District">
                <Input placeholder="e.g. New Delhi" value={form.district} onChange={set("district")} />
              </Field>
              <Field label="State">
                <Input placeholder="e.g. Delhi" value={form.state} onChange={set("state")} />
              </Field>
            </div>

            {role === "ambulance" && (
              <>
                <Field label="Driver Name *" error={fieldErrors.driverName}>
                  <Input placeholder="e.g. Vikram Singh" value={form.driverName} onChange={set("driverName")} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Ambulance Registration No. *" error={fieldErrors.registrationNumber}>
                    <Input placeholder="UP78 AB 1234" value={form.registrationNumber} onChange={set("registrationNumber")} />
                  </Field>
                  <Field label="Driver Licence No.">
                    <Input value={form.driverLicenceNumber} onChange={set("driverLicenceNumber")} />
                  </Field>
                  <Field label="Permit Number">
                    <Input value={form.permitNumber} onChange={set("permitNumber")} />
                  </Field>
                  <Field label="Insurance Number">
                    <Input value={form.insuranceNumber} onChange={set("insuranceNumber")} />
                  </Field>
                  <Field label="Hospital Association">
                    <Input placeholder="e.g. AIIMS Emergency" value={form.hospitalAssociation} onChange={set("hospitalAssociation")} />
                  </Field>
                  <Field label="Operating District">
                    <Input placeholder="e.g. South Delhi" value={form.operatingDistrict} onChange={set("operatingDistrict")} />
                  </Field>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Ambulance Type</Label>
                    <Select value={form.ambulanceType} onValueChange={v => setForm(f => ({ ...f, ambulanceType: v }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Life Support</SelectItem>
                        <SelectItem value="advanced">Advanced Life Support</SelectItem>
                        <SelectItem value="transport">Patient Transport</SelectItem>
                        <SelectItem value="emergency_response">Emergency Response</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DocumentQueue
                  label="Supporting documents (RC, permit, licence, insurance) *"
                  maxFiles={6}
                  files={form.docs}
                  allowed={["rc", "ambulance_permit", "driver_license", "insurance", "hospital_authorization"]}
                  error={fieldErrors.docs}
                  onChange={docs => setForm(f => ({ ...f, docs }))}
                />
              </>
            )}

            {role === "police" && (
              <>
                <Field label="Police Station Name *" error={fieldErrors.stationName}>
                  <Input placeholder="e.g. Connaught Place PS, New Delhi" value={form.stationName} onChange={set("stationName")} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Officer Name *" error={fieldErrors.officerName}>
                    <Input placeholder="e.g. S.I. Rakesh Kumar" value={form.officerName} onChange={set("officerName")} />
                  </Field>
                  <Field label="Officer ID">
                    <Input placeholder="e.g. DL/NCR/12345" value={form.officerId} onChange={set("officerId")} />
                  </Field>
                  <Field label="Designation">
                    <Input placeholder="Inspector" value={form.designation} onChange={set("designation")} />
                  </Field>
                </div>
                <DocumentQueue
                  label="ID proof / authorization letter *"
                  maxFiles={1}
                  files={form.policeDoc ? [form.policeDoc] : []}
                  allowed={["police_id_card", "police_authorization"]}
                  error={fieldErrors.policeDoc}
                  onChange={docs => setForm(f => ({ ...f, policeDoc: docs[0] ?? null }))}
                />
              </>
            )}

            {role === "hospital" && (
              <>
                <Field label="Hospital Name *" error={fieldErrors.hospitalName}>
                  <Input placeholder="e.g. Safdarjung Hospital" value={form.hospitalName} onChange={set("hospitalName")} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Registration Number">
                    <Input value={form.hospitalRegNumber} onChange={set("hospitalRegNumber")} />
                  </Field>
                  <Field label="Emergency Contact">
                    <Input placeholder="+91 98XXX XXXXX" value={form.emergencyContact} onChange={set("emergencyContact")} />
                  </Field>
                  <Field label="Contact Person Name">
                    <Input placeholder="e.g. Dr. Priya Sharma" value={form.contactName} onChange={set("contactName")} />
                  </Field>
                  <Field label="Contact Number">
                    <Input placeholder="+91 98XXX XXXXX" value={form.contactNumber} onChange={set("contactNumber")} />
                  </Field>
                </div>
                <Field label="Address">
                  <Textarea placeholder="Street, locality, pin code" value={form.address} onChange={set("address")} rows={2} />
                </Field>
                <DocumentQueue
                  label="Hospital license / registration certificate *"
                  maxFiles={1}
                  files={form.hospitalDoc ? [form.hospitalDoc] : []}
                  allowed={["hospital_license", "hospital_registration"]}
                  error={fieldErrors.hospitalDoc}
                  onChange={docs => setForm(f => ({ ...f, hospitalDoc: docs[0] ?? null }))}
                />
              </>
            )}
          </>
        )}

        {role === "public" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Notes (optional)</Label>
            <Textarea
              placeholder="Anything you'd like us to know..."
              value={form.notes}
              onChange={set("notes")}
              rows={2}
            />
          </div>
        )}

        {serverError && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
            {serverError}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onBack} disabled={submitting}>
            Back
          </Button>
          <Button
            onClick={() => {
              const err = validate();
              if (err) return;
              onSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {submitting
              ? role === "public"
                ? "Activating…"
                : "Submitting for verification…"
              : role === "public"
                ? "Activate Public Access"
                : "Submit for Verification"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Field helpers ----------------------------- */

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function DocumentQueue({
  label,
  maxFiles,
  files,
  allowed,
  error,
  onChange,
}: {
  label: string;
  maxFiles: number;
  files: Doc[];
  allowed: string[];
  error?: string;
  onChange: (next: Doc[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [allowedTypes] = useState(["application/pdf", "image/jpeg", "image/png", "image/jpg"]);
  const maxSize = 8 * 1024 * 1024;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: Doc[] = [...files];
    Array.from(list).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not accepted — use PDF, JPG or PNG.`);
        return;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large — max 8MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const doc: Doc = {
          docType: allowed[0],
          file,
          dataUrl: reader.result as string,
          sizeBytes: file.size,
        };
        onChange([...next, doc]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold">{label}</Label>
        <span className="text-[10px] text-muted-foreground">PDF, JPG or PNG — max 8MB each</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept={allowedTypes.join(",")}
        multiple={maxFiles > 1}
        onChange={e => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        {files.map((d, i) => (
          <div
            key={`${d.file.name}-${i}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
          >
            <FileText className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <div className="max-w-[180px]">
              <p className="truncate">{d.file.name}</p>
              <p className="text-[10px] text-muted-foreground">{DOC_LABELS[d.docType] ?? d.docType}</p>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-red-400 ml-1"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              aria-label={`Remove ${d.file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {files.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-emerald-400/40 hover:text-emerald-300 transition-colors"
          >
            <FileText className="h-4 w-4" /> {files.length === 0 ? "Attach documents" : "Add another"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ---------------------------- Pending state ------------------------------ */

function PendingState({
  user,
  role,
  onCheck,
}: {
  user: ReturnType<typeof useAuth>["user"];
  role: RoleKey;
  onCheck: () => void;
}) {
  const meta = role !== "public" ? ROLE_META[role] : null;
  const title = meta?.title ?? "public user";
  return (
    <Card className="rounded-2xl border p-8 text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/30">
        <Clock className="h-8 w-8 text-amber-400" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold">Application under review</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Your {title} registration has been submitted with your
        documents. A host administrator will verify your credentials — you'll
        get full access as soon as verification completes.
      </p>
      <div className="flex justify-center gap-2">
        <Badge variant="outline" className="border-amber-400/50 text-amber-300">
          Status: Pending
        </Badge>
        <Badge variant="outline" className="border-border">
          Role: {title}
        </Badge>
      </div>
      <div className="pt-2">
        <Button variant="outline" onClick={onCheck}>
          Continue to IntelliTraffic
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        You can still explore public features like live traffic, signals and
        route planning while you wait.
      </p>
    </Card>
  );
}
