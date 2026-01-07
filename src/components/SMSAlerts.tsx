import { useState } from "react";
import { Bell, Smartphone, MapPin, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const indianStates = [
  "All India",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Lakshadweep",
];

const magnitudeOptions = [
  { value: 3, label: "3+ (All earthquakes)" },
  { value: 4, label: "4+ (Light & above)" },
  { value: 5, label: "5+ (Moderate & above)" },
  { value: 6, label: "6+ (Strong & above)" },
];

const SMSAlerts = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedState, setSelectedState] = useState("All India");
  const [minMagnitude, setMinMagnitude] = useState(4);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error("Please enter your mobile number");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-sms-alert", {
        body: {
          phoneNumber,
          state: selectedState,
          minMagnitude,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuccess(true);
      toast.success("Alert registered successfully! Check your phone for confirmation.");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setPhoneNumber("");
      }, 3000);
    } catch (err: any) {
      console.error("SMS registration error:", err);
      toast.error(err.message || "Failed to register for alerts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="alerts" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Smartphone className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Instant SMS Alerts</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Earthquake Alerts via SMS
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Receive instant SMS notifications when earthquakes occur in your selected Indian state. 
            Works even without internet connectivity.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Bell, label: "Instant Alerts" },
              { icon: MapPin, label: "State-wise" },
              { icon: AlertTriangle, label: "Magnitude Filter" },
              { icon: Smartphone, label: "No Internet Needed" },
            ].map((feature, i) => (
              <div key={i} className="glass-card rounded-lg p-4 text-center">
                <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{feature.label}</p>
              </div>
            ))}
          </div>

          {/* Registration Form */}
          <div className="glass-card rounded-2xl p-8 border-primary/20">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-seismic-low mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Alert Registered!</h3>
                <p className="text-muted-foreground">
                  Check your phone for a confirmation SMS.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mobile Number (India)
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl bg-secondary border border-r-0 border-border text-muted-foreground">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="flex-1 h-12 px-4 rounded-r-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select State / Region
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                  >
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Magnitude Threshold */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Minimum Magnitude
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {magnitudeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMinMagnitude(option.value)}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          minMagnitude === option.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={loading || phoneNumber.length !== 10}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Register for SMS Alerts
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Standard SMS charges may apply. You can unsubscribe anytime by replying STOP.
                </p>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 glass-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-seismic-moderate" />
              Why SMS Alerts?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Works without internet</strong> - Critical during emergencies when networks are congested</li>
              <li>• <strong>Instant delivery</strong> - Receive alerts within seconds of earthquake detection</li>
              <li>• <strong>Location-specific</strong> - Only get alerts relevant to your state</li>
              <li>• <strong>Powered by NCS</strong> - Data from National Centre for Seismology, India</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SMSAlerts;
