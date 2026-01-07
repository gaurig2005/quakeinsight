import { useState } from "react";
import { 
  Shield, 
  AlertTriangle, 
  Home, 
  Building2, 
  Car, 
  Mountain,
  Phone,
  Heart,
  Package,
  Flashlight,
  Droplets,
  Radio,
  ChevronDown,
  ChevronUp,
  Download,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SafetyTip {
  id: string;
  title: string;
  icon: React.ElementType;
  tips: string[];
}

const beforeEarthquake: SafetyTip[] = [
  {
    id: "kit",
    title: "Emergency Kit",
    icon: Package,
    tips: [
      "Stock at least 3 days of water (4 liters per person per day)",
      "Non-perishable food items and manual can opener",
      "First aid kit with essential medicines",
      "Flashlight with extra batteries",
      "Battery-powered or hand-crank radio",
      "Whistle to signal for help",
      "Dust masks and plastic sheeting",
      "Wrench or pliers to turn off utilities",
      "Important documents in waterproof container",
    ],
  },
  {
    id: "plan",
    title: "Family Emergency Plan",
    icon: Heart,
    tips: [
      "Identify safe spots in each room (under sturdy tables, against interior walls)",
      "Practice DROP, COVER, and HOLD ON drills",
      "Establish an out-of-state contact for family check-ins",
      "Know how to shut off gas, electricity, and water",
      "Plan evacuation routes from home and work",
      "Keep emergency contacts list updated",
      "Ensure all family members know meeting points",
    ],
  },
  {
    id: "home",
    title: "Secure Your Home",
    icon: Home,
    tips: [
      "Bolt heavy furniture to walls",
      "Secure water heaters and gas appliances",
      "Install latches on cupboards",
      "Move heavy objects to lower shelves",
      "Check for structural vulnerabilities",
      "Know where main gas valve is located",
      "Keep fire extinguisher accessible",
    ],
  },
];

const duringEarthquake: SafetyTip[] = [
  {
    id: "indoor",
    title: "If Indoors",
    icon: Building2,
    tips: [
      "DROP to your hands and knees immediately",
      "Take COVER under a sturdy desk or table",
      "HOLD ON until shaking stops",
      "Stay away from windows, outside walls, and heavy objects",
      "Do NOT run outside during shaking",
      "If in bed, stay there and cover your head with a pillow",
      "If in a wheelchair, lock wheels and protect your head",
    ],
  },
  {
    id: "outdoor",
    title: "If Outdoors",
    icon: Mountain,
    tips: [
      "Move away from buildings, trees, streetlights, and utility wires",
      "Drop to the ground in an open area",
      "Protect your head and neck with your arms",
      "Stay in open area until shaking stops",
      "Watch for falling debris",
      "After shaking stops, move carefully and watch for hazards",
    ],
  },
  {
    id: "vehicle",
    title: "If in a Vehicle",
    icon: Car,
    tips: [
      "Pull over to a clear area safely",
      "Avoid stopping near buildings, overpasses, or utility wires",
      "Stay inside the vehicle with seatbelt fastened",
      "Set parking brake",
      "Turn on the radio for emergency information",
      "After shaking, proceed cautiously and avoid damaged roads",
    ],
  },
];

const afterEarthquake: SafetyTip[] = [
  {
    id: "immediate",
    title: "Immediate Actions",
    icon: AlertTriangle,
    tips: [
      "Check yourself and others for injuries",
      "Expect aftershocks - be ready to DROP, COVER, HOLD ON",
      "Check for gas leaks - if you smell gas, leave immediately",
      "Check for electrical damage - if you see sparks, turn off main breaker",
      "Check water lines for damage",
      "Use flashlights, not candles or matches",
      "Do not use elevators",
    ],
  },
  {
    id: "communication",
    title: "Stay Informed",
    icon: Radio,
    tips: [
      "Listen to emergency broadcasts on radio",
      "Use text messages instead of calls to reduce network load",
      "Check in with family members at designated contact",
      "Follow instructions from local authorities",
      "Do not spread rumors - verify information before sharing",
      "Register on 'I Am Alive' registry if available",
    ],
  },
  {
    id: "resources",
    title: "Access Resources",
    icon: Phone,
    tips: [
      "NDMA Helpline: 1078 (National Disaster Management Authority)",
      "Police: 100",
      "Fire: 101",
      "Ambulance: 102 / 108",
      "Women Helpline: 1091",
      "Child Helpline: 1098",
      "Disaster Management App: Download NDMA app",
    ],
  },
];

const essentialItems = [
  { icon: Droplets, name: "Water", quantity: "4L/person/day" },
  { icon: Package, name: "Food", quantity: "3-day supply" },
  { icon: Flashlight, name: "Flashlight", quantity: "With batteries" },
  { icon: Radio, name: "Radio", quantity: "Battery/hand-crank" },
  { icon: Heart, name: "First Aid", quantity: "Complete kit" },
  { icon: Phone, name: "Phone Charger", quantity: "Portable" },
];

const SafetyGuide = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["before"]);
  const [expandedTips, setExpandedTips] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleTip = (tipId: string) => {
    setExpandedTips(prev => 
      prev.includes(tipId) 
        ? prev.filter(t => t !== tipId)
        : [...prev, tipId]
    );
  };

  const renderTipCategory = (
    title: string,
    sectionId: string,
    tips: SafetyTip[],
    bgClass: string
  ) => (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection(sectionId)}
        className={`w-full p-6 flex items-center justify-between ${bgClass} transition-colors`}
      >
        <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          {title}
        </h3>
        {expandedSections.includes(sectionId) ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      
      {expandedSections.includes(sectionId) && (
        <div className="p-6 space-y-4">
          {tips.map((tip) => (
            <div key={tip.id} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleTip(tip.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <tip.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{tip.title}</span>
                </div>
                {expandedTips.includes(tip.id) ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {expandedTips.includes(tip.id) && (
                <ul className="px-4 pb-4 space-y-2">
                  {tip.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section id="safety" className="py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-seismic-high/10 border border-seismic-high/30 mb-4">
            <BookOpen className="w-4 h-4 text-seismic-high" />
            <span className="text-sm font-medium text-seismic-high">Offline Safety Guide</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Earthquake Safety Guide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Essential safety information for before, during, and after an earthquake. 
            Save this page for offline access during emergencies.
          </p>
        </div>

        {/* Quick Reference - Essential Kit */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Emergency Kit Essentials
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {essentialItems.map((item, i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-foreground text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="space-y-6">
          {renderTipCategory("Before an Earthquake", "before", beforeEarthquake, "bg-seismic-low/10")}
          {renderTipCategory("During an Earthquake", "during", duringEarthquake, "bg-seismic-high/10")}
          {renderTipCategory("After an Earthquake", "after", afterEarthquake, "bg-seismic-moderate/10")}
        </div>

        {/* Download for Offline */}
        <div className="mt-12 text-center">
          <div className="glass-card inline-block rounded-xl p-8">
            <Download className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Save for Offline Access</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Add this page to your home screen or bookmark it for quick access during emergencies when internet may not be available.
            </p>
            <Button variant="hero" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              Print Safety Guide
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetyGuide;
