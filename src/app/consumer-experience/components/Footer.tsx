import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const Footer = () => {
  const currentYear = new Date()?.getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Consumer Experience', href: '/consumer-experience' },
      { label: 'Merchant Partnership', href: '/merchant-partnership' },
      { label: 'Government Alignment', href: '/government-alignment' },
    ],
    resources: [
      { label: 'Security & Compliance', href: '/security-compliance' },
      { label: 'Financial Model', href: '/financial-model' },
      { label: 'Help Center', href: '#' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'POPIA Compliance', href: '#' },
    ],
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/homepage" className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="40" height="40" rx="8" fill="#20B2AA" />
                  <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.9" />
                  <path d="M20 15L24 18V22L20 25L16 22V18L20 15Z" fill="#FF7A00" />
                  <circle cx="20" cy="20" r="3" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-lg text-background leading-tight">
                  eVoucher
                </span>
                <span className="font-body text-xs text-background/70 leading-tight">
                  Dignified Impact
                </span>
              </div>
            </Link>
            <p className="text-sm text-background/70 mb-4">
              Digital commerce that serves South Africa's communities with dignity and transparency.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors duration-300"
              >
                <Icon name="GlobeAltIcon" size={20} variant="solid" className="text-background" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors duration-300"
              >
                <Icon name="EnvelopeIcon" size={20} variant="solid" className="text-background" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors duration-300"
              >
                <Icon name="PhoneIcon" size={20} variant="solid" className="text-background" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-headline font-bold text-background mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks?.platform?.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link?.href}
                    className="text-sm text-background/70 hover:text-primary transition-colors duration-300"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-headline font-bold text-background mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks?.resources?.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link?.href}
                    className="text-sm text-background/70 hover:text-primary transition-colors duration-300"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-headline font-bold text-background mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks?.legal?.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link?.href}
                    className="text-sm text-background/70 hover:text-primary transition-colors duration-300"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-background/70">
              &copy; {currentYear} eVoucher Platform. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Icon name="ShieldCheckIcon" size={16} variant="solid" className="text-success" />
                <span className="text-xs text-background/70">POPIA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="LockClosedIcon" size={16} variant="solid" className="text-success" />
                <span className="text-xs text-background/70">Secure Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
