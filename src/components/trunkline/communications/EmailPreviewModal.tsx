import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Smartphone, Monitor, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailPreviewModalProps {
  eventType: string;
  eventLabel: string;
  sampleData: Record<string, any>;
  onClose: () => void;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  eventType,
  eventLabel,
  sampleData,
  onClose,
}) => {
  const [html, setHtml] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: fnError } = await supabase.functions.invoke(
          "ecommerce-email-orchestrator",
          {
            body: { eventType, data: sampleData, preview: true },
          }
        );
        if (fnError) throw fnError;
        setHtml(res.html);
        setSubject(res.subject);
      } catch (err: any) {
        console.error("Preview fetch error:", err);
        setError(err.message || "Failed to render preview");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [eventType, sampleData]);

  useEffect(() => {
    if (html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html, deviceView]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {eventLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subject + device toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline" className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">Subject</Badge>
              <span className="text-sm font-medium truncate">{subject || "..."}</span>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => setDeviceView("desktop")}
                variant={deviceView === "desktop" ? "default" : "outline"}
                size="sm"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setDeviceView("mobile")}
                variant={deviceView === "mobile" ? "default" : "outline"}
                size="sm"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview frame */}
          <div
            className="border rounded-lg bg-muted/30 flex justify-center"
            style={{ height: "65vh" }}
          >
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Rendering template...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center text-destructive text-sm p-4">
                {error}
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                title="Email Preview"
                className="border-0 h-full"
                style={{
                  width: deviceView === "mobile" ? "375px" : "100%",
                  background: "#f5f5f5",
                }}
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
