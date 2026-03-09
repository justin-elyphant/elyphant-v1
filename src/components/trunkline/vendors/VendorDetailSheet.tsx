import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Ban, Clock, Globe, Mail, Phone, Building2, User } from "lucide-react";
import { Vendor } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useVendorApproval } from "@/hooks/trunkline/useVendorApproval";

interface VendorDetailSheetProps {
  vendor: Vendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VendorDetailSheet: React.FC<VendorDetailSheetProps> = ({
  vendor,
  open,
  onOpenChange,
}) => {
  const { mutate: performAction, isPending } = useVendorApproval();

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile", vendor?.user_id],
    enabled: !!vendor?.user_id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, profile_type, signup_source, signup_metadata")
        .eq("id", vendor!.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!vendor) return null;

  const signupMeta = profile?.signup_metadata as Record<string, any> | null;
  const title = signupMeta?.title || signupMeta?.job_title || null;

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    approved: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="h-3 w-3 mr-1" /> },
    rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3 mr-1" /> },
    suspended: { label: "Suspended", className: "bg-gray-50 text-gray-700 border-gray-200", icon: <Ban className="h-3 w-3 mr-1" /> },
  };

  const status = statusConfig[vendor.approval_status] || { label: "Unknown", className: "", icon: null };

  const handleAction = (action: "approved" | "rejected" | "suspended") => {
    performAction({ vendor_account_id: vendor.id, action });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{vendor.company_name}</SheetTitle>
          <SheetDescription>
            Applied {new Date(vendor.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div>
            <Badge variant="outline" className={status.className}>
              {status.icon}{status.label}
            </Badge>
          </div>

          <Separator />

          {/* Contact Information */}
          <Section title="Contact Information" icon={<User className="h-4 w-4" />}>
            <Field label="Name" value={profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "—" : "Loading..."} />
            {title && <Field label="Title" value={title} />}
            <Field label="Email" value={vendor.contact_email} />
            <Field label="Phone" value={vendor.phone || "—"} />
          </Section>

          <Separator />

          {/* Company Information */}
          <Section title="Company Details" icon={<Building2 className="h-4 w-4" />}>
            <Field label="Company Name" value={vendor.company_name} />
            <Field
              label="Website"
              value={
                vendor.website ? (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {vendor.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : "—"
              }
            />
            {vendor.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{vendor.description}</p>
              </div>
            )}
          </Section>

          <Separator />

          {/* Meta */}
          <Section title="Account Info" icon={<Mail className="h-4 w-4" />}>
            <Field label="Profile Type" value={profile?.profile_type || "—"} />
            <Field label="Signup Source" value={profile?.signup_source || "—"} />
            <Field label="Last Updated" value={new Date(vendor.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          </Section>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {vendor.approval_status === "pending" && (
              <>
                <Button size="sm" onClick={() => handleAction("approved")} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction("rejected")} disabled={isPending}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
            {vendor.approval_status === "approved" && (
              <Button size="sm" variant="outline" onClick={() => handleAction("suspended")} disabled={isPending}>
                <Ban className="h-4 w-4 mr-1" /> Suspend
              </Button>
            )}
            {(vendor.approval_status === "suspended" || vendor.approval_status === "rejected") && (
              <Button size="sm" onClick={() => handleAction("approved")} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-1" /> Re-approve
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">{icon}{title}</h3>
      <div className="space-y-2 pl-6">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );
}

export default VendorDetailSheet;
