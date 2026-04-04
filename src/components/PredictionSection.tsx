import { Brain, Cpu, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const PredictionSection = () => {
  const { t } = useTranslation();

  const predictions = [
    { region: "Himalayan Seismic Belt (Uttarakhand, Himachal)", probability: 72, magnitude: "5.0-6.5", timeframe: t("prediction.next72h"), status: "elevated" },
    { region: "North-East India (Assam, Manipur, Nagaland)", probability: 58, magnitude: "4.5-5.5", timeframe: t("prediction.next48h"), status: "moderate" },
    { region: "Andaman & Nicobar Islands", probability: 41, magnitude: "4.0-5.0", timeframe: t("prediction.next48h"), status: "moderate" },
    { region: "Kutch Region (Gujarat)", probability: 25, magnitude: "3.5-4.5", timeframe: t("prediction.next24h"), status: "low" },
    { region: "Kashmir & Ladakh", probability: 18, magnitude: "3.0-4.0", timeframe: t("prediction.next24h"), status: "low" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "elevated": return "text-seismic-high bg-seismic-high/10 border-seismic-high/30";
      case "moderate": return "text-seismic-moderate bg-seismic-moderate/10 border-seismic-moderate/30";
      default: return "text-seismic-low bg-seismic-low/10 border-seismic-low/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "elevated": return t("prediction.elevated");
      case "moderate": return t("prediction.moderate");
      default: return t("prediction.low");
    }
  };

  return (
    <section id="predictions" className="py-20 bg-gradient-dark relative">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Brain className="w-4 h-4" />
              {t("prediction.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("prediction.title")}<br />
              <span className="text-gradient">{t("prediction.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">{t("prediction.description")}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Cpu, label: t("prediction.neuralNetworks"), desc: t("prediction.neuralNetworksDesc") },
                { icon: TrendingUp, label: t("prediction.accuracy"), desc: t("prediction.accuracyDesc") },
                { icon: Shield, label: t("prediction.earlyWarning"), desc: t("prediction.earlyWarningDesc") },
                { icon: Zap, label: t("prediction.realTime"), desc: t("prediction.realTimeDesc") },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-card/30 border border-border/30">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">{t("prediction.currentPredictions")}</h3>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>

            {predictions.map((pred, index) => (
              <div key={index} className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{pred.region}</h4>
                    <p className="text-sm text-muted-foreground">{pred.timeframe}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(pred.status)}`}>
                    {getStatusLabel(pred.status)}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t("prediction.probability")}</span>
                    <span className="font-mono font-bold text-foreground">{pred.probability}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-seismic-severe rounded-full transition-all duration-1000" style={{ width: `${pred.probability}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("prediction.expectedMagnitude")}</span>
                  <span className="font-mono font-semibold text-foreground">{pred.magnitude}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PredictionSection;
