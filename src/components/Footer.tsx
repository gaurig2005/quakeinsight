import { Activity, Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const links = {
    product: [
      { label: "Dashboard", href: "#dashboard" },
      { label: "Live Map", href: "#map" },
      { label: "Predictions", href: "#predictions" },
      { label: "Alerts", href: "#alerts" },
    ],
    resources: [
      { label: "Documentation", href: "#" },
      { label: "API Access", href: "#" },
      { label: "Research Papers", href: "#" },
      { label: "Data Sources", href: "#" },
    ],
    company: [
      { label: "About Us", href: "#about" },
      { label: "Contact", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  };

  return (
    <footer id="about" className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">
                <span className="text-gradient">Quake</span>
                <span className="text-foreground">Insight</span>
              </span>
            </a>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Advanced earthquake prediction and real-time seismic monitoring powered by 
              cutting-edge AI technology. Keeping communities safe worldwide.
            </p>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin, Mail].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 QuakeInsight. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Data sourced from USGS, EMSC, and global seismic networks
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
