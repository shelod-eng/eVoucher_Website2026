import React from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Testimonial {
  name: string;
  business: string;
  location: string;
  image: string;
  alt: string;
  quote: string;
  revenueIncrease: string;
  newCustomers: string;
  timeframe: string;
}

const TestimonialsSection = () => {
  const testimonials: Testimonial[] = [
  {
    name: 'Thabo Mokoena',
    business: 'Mokoena General Store',
    location: 'Soweto, Johannesburg',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1f3a27953-1770217040572.png",
    alt: 'Middle-aged Black man with short grey hair wearing blue shirt smiling in front of grocery store shelves',
    quote: 'eVoucher transformed my business completely. Within 3 months, I saw a 52% increase in revenue and gained over 400 new regular customers. The analytics dashboard helps me understand what my customers want, and the same-day settlement means I always have cash flow to restock. This platform gave my small store the tools that only big retailers used to have.',
    revenueIncrease: '+52%',
    newCustomers: '400+',
    timeframe: '3 months'
  },
  {
    name: 'Nomsa Dlamini',
    business: 'Dlamini Fresh Produce',
    location: 'Alexandra, Johannesburg',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_17f106aeb-1767472224727.png",
    alt: 'Smiling Black woman with braided hair wearing green apron standing among fresh vegetables and fruits',
    quote: 'As a single mother running a vegetable stand, every rand counts. eVoucher brought me 280 new customers in my first month alone. The loyalty program keeps them coming back, and I love that I am helping families in my community save money on fresh produce. The platform is so easy to use, and the support team is always there when I need help.',
    revenueIncrease: '+38%',
    newCustomers: '280+',
    timeframe: '1 month'
  },
  {
    name: 'Sipho Ndlovu',
    business: 'Ndlovu Hardware & Building Supplies',
    location: 'Khayelitsha, Cape Town',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d29504f2-1763294463041.png",
    alt: 'Black man with short hair wearing orange safety vest and hard hat smiling in hardware store with tools in background',
    quote: 'I was skeptical at first, but the results speak for themselves. My hardware store revenue increased by 61% in 6 months, and I gained 520 new customers. The free analytics showed me which products to stock more of, and the settlement process is incredibly reliable. eVoucher helped me expand my business and hire two additional staff members.',
    revenueIncrease: '+61%',
    newCustomers: '520+',
    timeframe: '6 months'
  }];


  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
            <Icon name="ChatBubbleLeftRightIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">Merchant Success Stories</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Real Merchants, Real Results
          </h2>
          <p className="text-lg text-muted-foreground">
            Discover how township businesses are thriving with eVoucher's merchant partnership program.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) =>
          <div
            key={index}
            className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300">

              <div className="relative h-64 overflow-hidden">
                <AppImage
                src={testimonial.image}
                alt={testimonial.alt}
                className="w-full h-full object-cover" />

                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-headline font-bold text-xl text-white mb-1">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-white/90 font-body">{testimonial.business}</p>
                  <div className="flex items-center space-x-1 text-white/80 mt-1">
                    <Icon name="MapPinIcon" size={14} variant="solid" />
                    <span className="text-xs font-body">{testimonial.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-2">
                  <Icon name="ChatBubbleLeftIcon" size={20} variant="solid" className="text-primary mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground font-body leading-relaxed text-sm">
                    "{testimonial.quote}"
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-headline font-bold text-success">{testimonial.revenueIncrease}</p>
                    <p className="text-xs text-muted-foreground font-body">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-headline font-bold text-primary">{testimonial.newCustomers}</p>
                    <p className="text-xs text-muted-foreground font-body">Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-headline font-bold text-secondary">{testimonial.timeframe}</p>
                    <p className="text-xs text-muted-foreground font-body">Timeframe</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

};

export default TestimonialsSection;