import AppImage from '@/components/ui/AppImage';

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
    logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1854d5482-1767528559838.png",
    alt: 'Pick n Pay retail store logo with green and white branding',
    category: 'Retail'
  },
  {
    name: 'Shoprite',
    logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1dd123703-1767528559798.png",
    alt: 'Shoprite supermarket logo with red and yellow colors',
    category: 'Retail'
  },
  {
    name: 'Boxer',
    logo: "https://img.rocket.new/generatedImages/rocket_gen_img_19f2efae6-1767528559477.png",
    alt: 'Boxer stores logo with blue and white warehouse theme',
    category: 'Retail'
  },
  {
    name: 'Spar',
    logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1135f5151-1767528558581.png",
    alt: 'Spar convenience store logo with green pine tree symbol',
    category: 'Retail'
  },
  {
    name: 'Checkers',
    logo: "https://img.rocket.new/generatedImages/rocket_gen_img_110ead140-1767528561075.png",
    alt: 'Checkers supermarket logo with blue and white checkered pattern',
    category: 'Retail'
  },
  {
    name: 'Woolworths',
    logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1554c0b59-1767528569527.png",
    alt: 'Woolworths premium retail logo with elegant green branding',
    category: 'Retail'
  }];


  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
            Trusted by Leading Retailers
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            Partnering with South Africa's most recognized brands
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) =>
          <div
            key={index}
            className="flex items-center justify-center p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow duration-300 grayscale hover:grayscale-0">

              <AppImage
              src={partner.logo}
              alt={partner.alt}
              className="w-full h-16 object-contain" />

            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="font-body text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">487+ merchant partners</span> and growing across South Africa
          </p>
        </div>
      </div>
    </section>);

};

export default PartnerLogos;