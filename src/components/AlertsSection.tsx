import { Bell, Mail, Smartphone, Globe, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const AlertsSection = () => {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: Bell,
      title: "Instant Alerts",
      description: "Get notified within seconds of any seismic activity in your monitored regions",
    },
    {
      icon: Smartphone,
      title: "Multi-Platform",
      description: "Receive alerts via SMS, push notifications, email, or all three",
    },
    {
      icon: Globe,
      title: "Custom Regions",
      description: "Set up monitoring for specific geographic areas that matter to you",
    },
    {
      icon: Shield,
      title: "Safety Tips",
      description: "Get personalized safety recommendations based on earthquake magnitude",
    },
    {
      icon: Clock,
      title: "Early Warning",
      description: "Advanced prediction system provides warnings before earthquakes hit",
    },
    {
      icon: Mail,
      title: "Daily Digest",
      description: "Optional daily summary of all seismic activity in your regions",
    },
  ];

  return (
    <section id="alerts" className="py-20 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stay Informed, Stay Safe
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Set up personalized earthquake alerts and never be caught off guard
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group cursor-default"
            >
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center border-primary/20">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Get Early Earthquake Alerts
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of users who stay prepared with our real-time earthquake notification system
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button variant="hero" size="lg">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Free forever. Unsubscribe anytime. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlertsSection;
