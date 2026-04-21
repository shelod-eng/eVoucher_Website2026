import AppImage from '@/components/ui/AppImage';
import Link from 'next/link';

interface Partner {
  name: string;
  logo: string;
  alt: string;
  category: string;
}

const PartnerLogos = () => {
  const partners: Partner[] = [
    {
      name: 'Pick n Pay',
      logo: '/assets/images/merchants/picknpay.png',
      alt: 'Pick n Pay retail logo',
      category: 'Retail',
    },
    {
      name: 'Super Precast',
      logo: '/assets/images/merchants/super-precast.svg',
      alt: 'Super Precast Concrete logo',
      category: 'Construction',
    },
    {
      name: 'Shoprite',
      logo: '/assets/images/merchants/shoprite.png',
      alt: 'Shoprite supermarket logo',
      category: 'Retail',
    },
    {
      name: 'Boxer',
      logo: '/assets/images/merchants/boxer.png',
      alt: 'Boxer stores logo',
      category: 'Retail',
    },
    {
      name: 'Checkers',
      logo: '/assets/images/merchants/checkers.png',
      alt: 'Checkers supermarket logo',
      category: 'Retail',
    },
    {
      name: 'USave',
      logo: '/assets/images/merchants/usave.png',
      alt: 'USave retail logo',
      category: 'Retail',
    },
    {
      name: 'Game',
      logo: '/assets/images/merchants/game.png',
      alt: 'Game retail logo',
      category: 'Retail',
    },
    {
      name: 'Edgars',
      logo: '/assets/images/merchants/edgars.png',
      alt: 'Edgars retail logo',
      category: 'Retail',
    },
    {
      name: 'Mr Price',
      logo: '/assets/images/merchants/mr-price.png',
      alt: 'Mr Price retail logo',
      category: 'Retail',
    },
    {
      name: 'Engen',
      logo: '/assets/images/merchants/engen.png',
      alt: 'Engen logo',
      category: 'Partner',
    },
    {
      name: 'Cell C',
      logo: '/assets/images/merchants/cellc.png',
      alt: 'Cell C logo',
      category: 'Partner',
    },
    {
      name: 'Telkom',
      logo: '/assets/images/merchants/telkom.jpg',
      alt: 'Telkom logo',
      category: 'Partner',
    },
    {
      name: 'Rea Vaya',
      logo: '/assets/images/merchants/reyavaya.png',
      alt: 'Rea Vaya logo',
      category: 'Transport',
    },
    {
      name: 'A Re Yeng',
      logo: '/assets/images/merchants/areyeng.png',
      alt: 'A Re Yeng logo',
      category: 'Transport',
    },
    {
      name: 'PRASA Be Moved',
      logo: '/assets/images/merchants/prasa-be-moved.png',
      alt: 'PRASA Be Moved logo',
      category: 'Transport',
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="mb-12 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="font-headline text-xs uppercase tracking-wide text-primary font-semibold">
            Featured Partner Networks
          </p>
          <div className="mt-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-headline font-bold text-3xl text-foreground">
                Kalapeng Pharmacy Group
              </h3>
              <p className="font-body text-sm text-muted-foreground mt-1">
                35 Branches + Loyalty Enabled. Earn points on every purchase with branch-aware
                fulfilment.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full text-xs bg-success/15 text-success font-headline font-semibold">
                  35 Branches
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-warning/15 text-warning font-headline font-semibold">
                  Loyalty Enabled
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/shop?brandKey=kalapeng"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
              >
                Shop Kalapeng
              </Link>
              <Link
                href="/benefits?merchant=kalapeng"
                className="px-4 py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
              >
                Join Kalapeng Loyalty
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
            Trusted by Leading Retailers
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            Partnering with South Africa's most recognized brands
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow duration-300 grayscale hover:grayscale-0"
            >
              <AppImage
                src={partner.logo}
                alt={partner.alt}
                className="w-full h-16 object-contain"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="font-body text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">487+ merchant partners</span> and
            growing across South Africa
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnerLogos;
