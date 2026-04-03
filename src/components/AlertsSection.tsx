import { useState } from "react";
import { Bell, Mail, MessageCircle, MapPin, AlertTriangle, CheckCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
            <span className="text-sm font-medium text-primary">Earthquake Alerts</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Instant Earthquake Alerts
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Receive instant notifications via Email and WhatsApp when earthquakes occur in your region.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Mail, label: "Email Alerts" },
              { icon: MessageCircle, label: "WhatsApp Alerts" },
              { icon: MapPin, label: "State-wise" },
              { icon: Shield, label: "Free Forever" },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-lg p-4 text-center">
                <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-8 border-primary/20">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-[hsl(var(--success))] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Alert Registered!</h3>
                <p className="text-muted-foreground">You'll be notified when earthquakes happen in your region.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alert Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Alert Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "email" as AlertType, label: "Email Only", icon: Mail },
                      { value: "whatsapp" as AlertType, label: "WhatsApp Only", icon: MessageCircle },
                      { value: "both" as AlertType, label: "Both", icon: Bell },
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

                {/* Email Input */}
                {(alertType === "email" || alertType === "both") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}

                {/* WhatsApp Input */}
                {(alertType === "whatsapp" || alertType === "both") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">WhatsApp Number (India)</label>
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

                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Select State / Region</label>
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

                {/* Magnitude Threshold */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Minimum Magnitude</label>
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

                {/* Submit */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitDisabled}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Subscribe to Alerts
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Free forever. Unsubscribe anytime. No spam, ever.
                </p>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 glass-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Why Subscribe?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Instant delivery</strong> — Receive alerts within seconds of earthquake detection</li>
              <li>• <strong>Location-specific</strong> — Only get alerts relevant to your state</li>
              <li>• <strong>Multi-channel</strong> — Get notified via Email, WhatsApp, or both</li>
              <li>• <strong>Powered by NCS</strong> — Data from National Centre for Seismology, India</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlertsSection;
