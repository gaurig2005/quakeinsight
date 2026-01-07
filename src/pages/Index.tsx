import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RecentEarthquakes from "@/components/RecentEarthquakes";
import GlobalMap from "@/components/GlobalMap";
import PredictionSection from "@/components/PredictionSection";
import AlertsSection from "@/components/AlertsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <RecentEarthquakes />
      <GlobalMap />
      <PredictionSection />
      <AlertsSection />
      <Footer />
    </div>
  );
};

export default Index;
