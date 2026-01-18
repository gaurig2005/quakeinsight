import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Hospital, Droplets, Home, Phone, Flame, Ambulance,
  MapPin, Clock, ExternalLink, Navigation, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmergencyResource {
  id: string;
  name: string;
  type: "hospital" | "blood_bank" | "shelter" | "police" | "fire";
  address: string;
  phone: string;
  distance: number;
  open24h: boolean;
  coordinates: { lat: number; lng: number };
}

const mockResources: EmergencyResource[] = [
  { id: "1", name: "AIIMS Delhi", type: "hospital", address: "Ansari Nagar, New Delhi", phone: "011-26588500", distance: 2.5, open24h: true, coordinates: { lat: 28.5672, lng: 77.2100 } },
  { id: "2", name: "Safdarjung Hospital", type: "hospital", address: "Ring Road, New Delhi", phone: "011-26707437", distance: 3.1, open24h: true, coordinates: { lat: 28.5683, lng: 77.2066 } },
  { id: "3", name: "Red Cross Blood Bank", type: "blood_bank", address: "Red Cross Bhawan, Delhi", phone: "011-23711551", distance: 4.2, open24h: true, coordinates: { lat: 28.6139, lng: 77.2090 } },
  { id: "4", name: "NDRF Camp Shelter", type: "shelter", address: "Pragati Maidan, Delhi", phone: "011-24363260", distance: 5.0, open24h: true, coordinates: { lat: 28.6188, lng: 77.2403 } },
  { id: "5", name: "Delhi Police HQ", type: "police", address: "ITO, New Delhi", phone: "100", distance: 3.8, open24h: true, coordinates: { lat: 28.6280, lng: 77.2410 } },
  { id: "6", name: "Delhi Fire Service", type: "fire", address: "Connaught Place, Delhi", phone: "101", distance: 2.9, open24h: true, coordinates: { lat: 28.6315, lng: 77.2167 } },
];

const helplines = [
  { name: "NDMA Helpline", number: "1078", icon: Shield },
  { name: "Police", number: "100", icon: Phone },
  { name: "Fire", number: "101", icon: Flame },
  { name: "Ambulance", number: "102 / 108", icon: Ambulance },
  { name: "Women Helpline", number: "1091", icon: Phone },
  { name: "Child Helpline", number: "1098", icon: Phone },
];

const EmergencyDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");

  const getIcon = (type: string) => {
    switch (type) {
      case "hospital": return Hospital;
      case "blood_bank": return Droplets;
      case "shelter": return Home;
      case "police": return Phone;
      case "fire": return Flame;
      default: return MapPin;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hospital": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "blood_bank": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "shelter": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "police": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "fire": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredResources = activeTab === "all" 
    ? mockResources 
    : mockResources.filter(r => r.type === activeTab);

  return (
    <section id="emergency" className="py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 mb-4">
            <Ambulance className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{t("emergency.title")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("emergency.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("emergency.subtitle")}
          </p>
        </div>

        {/* Emergency Helplines */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            {t("emergency.helplines")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {helplines.map((line) => (
              <a
                key={line.number}
                href={`tel:${line.number}`}
                className="flex flex-col items-center p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all group"
              >
                <line.icon className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-lg text-foreground">{line.number}</p>
                <p className="text-xs text-muted-foreground text-center">{line.name}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Resource Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hospital">{t("emergency.hospitals")}</TabsTrigger>
            <TabsTrigger value="blood_bank">{t("emergency.bloodBanks")}</TabsTrigger>
            <TabsTrigger value="shelter">{t("emergency.shelters")}</TabsTrigger>
            <TabsTrigger value="police">{t("emergency.police")}</TabsTrigger>
            <TabsTrigger value="fire">{t("emergency.fire")}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => {
                const Icon = getIcon(resource.type);
                return (
                  <div key={resource.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{resource.name}</h4>
                          <p className="text-sm text-muted-foreground">{resource.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Navigation className="w-3 h-3" />
                        {resource.distance} {t("common.km")}
                      </span>
                      {resource.open24h && (
                        <Badge variant="outline" className="text-green-400 border-green-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          {t("emergency.open24h")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="flex-1" asChild>
                        <a href={`tel:${resource.phone}`}>
                          <Phone className="w-4 h-4 mr-1" />
                          {t("emergency.call")}
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${resource.coordinates.lat},${resource.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          {t("emergency.directions")}
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default EmergencyDashboard;
