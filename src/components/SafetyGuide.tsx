import { useState } from "react";
import { 
  Shield, AlertTriangle, Home, Building2, Car, Mountain,
  Phone, Heart, Package, Flashlight, Droplets, Radio,
  ChevronDown, ChevronUp, Download, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface SafetyTip {
  id: string;
  titleKey: string;
  icon: React.ElementType;
  tipKeys: string[];
}

const SafetyGuide = () => {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<string[]>(["before"]);
  const [expandedTips, setExpandedTips] = useState<string[]>([]);

  const beforeEarthquake: SafetyTip[] = [
    { id: "kit", titleKey: "safety.emergencyKit", icon: Package, tipKeys: Array.from({length: 9}, (_, i) => `safety.kit_tip_${i+1}`) },
    { id: "plan", titleKey: "safety.familyPlan", icon: Heart, tipKeys: Array.from({length: 7}, (_, i) => `safety.plan_tip_${i+1}`) },
    { id: "home", titleKey: "safety.secureHome", icon: Home, tipKeys: Array.from({length: 7}, (_, i) => `safety.home_tip_${i+1}`) },
  ];

  const duringEarthquake: SafetyTip[] = [
    { id: "indoor", titleKey: "safety.ifIndoors", icon: Building2, tipKeys: Array.from({length: 7}, (_, i) => `safety.indoor_tip_${i+1}`) },
    { id: "outdoor", titleKey: "safety.ifOutdoors", icon: Mountain, tipKeys: Array.from({length: 6}, (_, i) => `safety.outdoor_tip_${i+1}`) },
    { id: "vehicle", titleKey: "safety.ifVehicle", icon: Car, tipKeys: Array.from({length: 6}, (_, i) => `safety.vehicle_tip_${i+1}`) },
  ];

  const afterEarthquake: SafetyTip[] = [
    { id: "immediate", titleKey: "safety.immediateActions", icon: AlertTriangle, tipKeys: Array.from({length: 7}, (_, i) => `safety.immediate_tip_${i+1}`) },
    { id: "communication", titleKey: "safety.stayInformed", icon: Radio, tipKeys: Array.from({length: 6}, (_, i) => `safety.comm_tip_${i+1}`) },
    { id: "resources", titleKey: "safety.accessResources", icon: Phone, tipKeys: Array.from({length: 7}, (_, i) => `safety.resource_tip_${i+1}`) },
  ];

  const essentialItems = [
    { icon: Droplets, nameKey: "safety.water", qtyKey: "safety.waterQty" },
    { icon: Package, nameKey: "safety.food", qtyKey: "safety.foodQty" },
    { icon: Flashlight, nameKey: "safety.flashlight", qtyKey: "safety.flashlightQty" },
    { icon: Radio, nameKey: "safety.radio", qtyKey: "safety.radioQty" },
    { icon: Heart, nameKey: "safety.firstAid", qtyKey: "safety.firstAidQty" },
    { icon: Phone, nameKey: "safety.phoneCharger", qtyKey: "safety.phoneChargerQty" },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const toggleTip = (tipId: string) => {
    setExpandedTips(prev => prev.includes(tipId) ? prev.filter(t => t !== tipId) : [...prev, tipId]);
  };

  const renderTipCategory = (titleKey: string, sectionId: string, tips: SafetyTip[], bgClass: string) => (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => toggleSection(sectionId)} className={`w-full p-6 flex items-center justify-between ${bgClass} transition-colors`}>
        <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          {t(titleKey)}
        </h3>
        {expandedSections.includes(sectionId) ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      
      {expandedSections.includes(sectionId) && (
        <div className="p-6 space-y-4">
          {tips.map((tip) => (
            <div key={tip.id} className="border border-border/50 rounded-lg overflow-hidden">
              <button onClick={() => toggleTip(tip.id)} className="w-full p-4 flex items-center justify-between hover:bg-card/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <tip.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{t(tip.titleKey)}</span>
                </div>
                {expandedTips.includes(tip.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              
              {expandedTips.includes(tip.id) && (
                <ul className="px-4 pb-4 space-y-2">
                  {tip.tipKeys.map((key, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {t(key)}
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
            <span className="text-sm font-medium text-seismic-high">{t("safety.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("safety.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("safety.subtitle")}</p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {t("safety.kitEssentials")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {essentialItems.map((item, i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-foreground text-sm">{t(item.nameKey)}</p>
                <p className="text-xs text-muted-foreground">{t(item.qtyKey)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {renderTipCategory("safety.before", "before", beforeEarthquake, "bg-seismic-low/10")}
          {renderTipCategory("safety.during", "during", duringEarthquake, "bg-seismic-high/10")}
          {renderTipCategory("safety.after", "after", afterEarthquake, "bg-seismic-moderate/10")}
        </div>

        <div className="mt-12 text-center">
          <div className="glass-card inline-block rounded-xl p-8">
            <Download className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{t("safety.saveOffline")}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">{t("safety.saveOfflineDesc")}</p>
            <Button variant="hero" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              {t("safety.printGuide")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetyGuide;
