import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import IndiaMap from "@/components/IndiaMap";
import SeismicMonitoringDashboard from "@/components/SeismicMonitoringDashboard";
import HistoricalEarthquakes from "@/components/HistoricalEarthquakes";
import SafetyGuide from "@/components/SafetyGuide";
import SMSAlerts from "@/components/SMSAlerts";
import PredictionSection from "@/components/PredictionSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <IndiaMap />
      <SeismicMonitoringDashboard />
      <HistoricalEarthquakes />
      <SafetyGuide />
      <SMSAlerts />
      <PredictionSection />
      <Footer />
    </div>
  );
};

export default Index;
