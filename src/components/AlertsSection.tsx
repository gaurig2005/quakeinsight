import { useState } from "react";
import { Bell, Mail, MessageCircle, MapPin, AlertTriangle, CheckCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const indianStates = [
  "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Delhi NCR", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar Islands", "Lakshadweep",
];

const magnitudeOptions = [
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 5, label: "5+" },
  { value: 6, label: "6+" },
];

type AlertType = "email" | "whatsapp" | "both";

const AlertsSection = () => {
  const { t } = useTranslation();
  const [alertType, setAlertType] = useState<AlertType>("both");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedState, setSelectedState] = useState("All India");
  const [minMagnitude, setMinMagnitude] = useState(4);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((alertType === "email" || alertType === "both") && !email) {
      toast.error("Please enter your email address");
      return;
    }
    if ((alertType === "whatsapp" || alertType === "both") && !whatsappNumber) {
      toast.error("Please enter your WhatsApp number");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-alert", {
        body: {
          alertType,
          email: email || undefined,
          whatsappNumber: whatsappNumber || undefined,
          state: selectedState,
          minMagnitude,
        },
      });

      if (error) throw error;
      if (data.error) {
        const errMsg = typeof data.error === "string" ? data.error : Object.values(data.error).flat().join(", ");
        toast.error(errMsg);
        return;
      }

      setSuccess(true);
      toast.success(data.message || "Alert registered successfully!");
      setTimeout(() => {
        setSuccess(false);
        setEmail("");
        setWhatsappNumber("");
      }, 4000);
    } catch (err: any) {
      console.error("Alert registration error:", err);
      toast.error(err.message || "Failed to register for alerts");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading
    || ((alertType === "email" || alertType === "both") && !email)
    || ((alertType === "whatsapp" || alertType === "both") && whatsappNumber.length !== 10);

  return (
    <section id="alerts" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("alerts.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("alerts.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("alerts.description")}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Mail, label: t("alerts.emailAlerts") },
              { icon: MessageCircle, label: t("alerts.whatsappAlerts") },
              { icon: MapPin, label: t("alerts.stateWise") },
              { icon: Shield, label: t("alerts.freeForever") },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-lg p-4 text-center">
                <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-8 border-primary/20">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-[hsl(var(--success))] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">{t("alerts.successTitle")}</h3>
                <p className="text-muted-foreground">{t("alerts.successDesc")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">{t("alerts.alertChannel")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "email" as AlertType, label: t("alerts.emailOnly"), icon: Mail },
                      { value: "whatsapp" as AlertType, label: t("alerts.whatsappOnly"), icon: MessageCircle },
                      { value: "both" as AlertType, label: t("alerts.both"), icon: Bell },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAlertType(opt.value)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                          alertType === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(alertType === "email" || alertType === "both") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t("alerts.emailAddress")}</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}

                {(alertType === "whatsapp" || alertType === "both") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t("alerts.whatsappNumber")}</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl bg-secondary border border-r-0 border-border text-muted-foreground">
                        +91
                      </span>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="flex-1 h-12 px-4 rounded-r-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("alerts.selectState")}</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                  >
                    {indianStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("alerts.minMagnitude")}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {magnitudeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMinMagnitude(opt.value)}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          minMagnitude === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isSubmitDisabled}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("alerts.registering")}
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      {t("alerts.subscribe")}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t("alerts.freeNote")}
                </p>
              </form>
            )}
          </div>

          <div className="mt-8 glass-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              {t("alerts.whySubscribe")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>{t("alerts.instantDelivery")}</strong> — {t("alerts.instantDeliveryDesc")}</li>
              <li>• <strong>{t("alerts.locationSpecific")}</strong> — {t("alerts.locationSpecificDesc")}</li>
              <li>• <strong>{t("alerts.multiChannel")}</strong> — {t("alerts.multiChannelDesc")}</li>
              <li>• <strong>{t("alerts.poweredByNCS")}</strong> — {t("alerts.poweredByNCSDesc")}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlertsSection;
