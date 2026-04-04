import { Activity, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const links = {
    product: [
      { label: t("footer.dashboard"), href: "#dashboard" },
      { label: t("footer.liveMap"), href: "#map" },
      { label: t("footer.predictions"), href: "#predictions" },
      { label: t("footer.alerts"), href: "#alerts" },
    ],
    resources: [
      { label: t("footer.documentation"), href: "#" },
      { label: t("footer.apiAccess"), href: "#" },
      { label: t("footer.researchPapers"), href: "#" },
      { label: t("footer.dataSources"), href: "#" },
    ],
    company: [
      { label: t("footer.aboutUs"), href: "#about" },
      { label: t("footer.contact"), href: "#" },
      { label: t("footer.privacyPolicy"), href: "#" },
      { label: t("footer.termsOfService"), href: "#" },
    ],
  };

  return (
    <footer id="about" className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">
                <span className="text-gradient">Quake</span>
                <span className="text-foreground">Insight</span>
              </span>
            </a>
            <p className="text-muted-foreground mb-6 max-w-sm">{t("footer.brandDesc")}</p>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin, Mail].map((Icon, index) => (
                <a key={index} href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.product")}</h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}><a href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.resources")}</h4>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.label}><a href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.company")}</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}><a href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <p className="text-sm text-muted-foreground">{t("footer.dataSourced")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
