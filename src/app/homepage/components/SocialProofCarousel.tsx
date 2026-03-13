'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  stakeholder: string;
  image: string;
  alt: string;
  quote: string;
  metric: string;
  metricValue: string;
}

const SocialProofCarousel = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Thandi Mkhize',
      role: 'Single Mother of Three',
      stakeholder: 'Consumer',
      image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1ad91979a-1763295629510.png',
      alt: 'African woman with braided hair wearing yellow top smiling warmly at camera',
      quote:
        "eVoucher has changed my life. I save R800 every month on groceries, which means my children can have better meals. The USSD system is so easy - I don't need a smartphone.",
      metric: 'Monthly Savings',
      metricValue: 'R 800',
    },
    {
      id: 2,
      name: 'Sipho Ndlovu',
      role: 'Spaza Shop Owner',
      stakeholder: 'Merchant',
      image: 'https://images.unsplash.com/photo-1633507898573-0d3f6aa1cac2',
      alt: 'African man in blue shirt standing in front of small retail shop with produce',
      quote:
        "Since joining eVoucher, my customer base has grown by 40%. The platform handles loyalty for me, and I get paid quickly. It's helping my business thrive in the township.",
      metric: 'Revenue Increase',
      metricValue: '+40%',
    },
    {
      id: 3,
      name: 'Dr. Nomsa Khumalo',
      role: 'Social Development Director',
      stakeholder: 'Government',
      image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1e472b39e-1763300474714.png',
      alt: 'Professional African woman in navy blazer with short hair in modern office',
      quote:
        'eVoucher provides the transparency and accountability we need for social programs. Real-time impact tracking and fraud prevention give us confidence in every rand spent.',
      metric: 'Program Efficiency',
      metricValue: '+65%',
    },
    {
      id: 4,
      name: 'Zanele Dlamini',
      role: 'Community Health Worker',
      stakeholder: 'Consumer',
      image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1e6851c39-1763295120619.png',
      alt: 'African woman with natural hair wearing white medical uniform smiling confidently',
      quote:
        'I can now afford nutritious food for my family while saving for emergencies. The dignity of choosing what I buy, when I buy it, makes all the difference.',
      metric: 'Annual Savings',
      metricValue: 'R 9,600',
    },
    {
      id: 5,
      name: 'Mandla Sithole',
      role: 'Butchery Owner',
      stakeholder: 'Merchant',
      image: 'https://images.unsplash.com/photo-1597244544618-2b55dc8ee24b',
      alt: 'African man with beard wearing white apron in butcher shop with meat display',
      quote:
        'The eVoucher system brought new customers to my butchery. Fast settlements mean I can restock quickly. My business has never been better.',
      metric: 'New Customers',
      metricValue: '+156',
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isHydrated) {
    return (
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="font-headline font-bold text-3xl lg:text-5xl text-foreground mb-4">
              Real Stories, Real Impact
            </h2>
            <p className="font-body text-lg text-muted-foreground">Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  const currentTestimonial = testimonials[currentIndex];
  const stakeholderColors: Record<string, string> = {
    Consumer: 'bg-primary text-primary-foreground',
    Merchant: 'bg-secondary text-secondary-foreground',
    Government: 'bg-trust-builder text-trust-builder-foreground',
  };

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-headline font-bold text-3xl lg:text-5xl text-foreground mb-4">
            Real Stories, Real Impact
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from consumers, merchants, and government partners experiencing the transformative
            power of eVoucher.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-5 gap-0">
              {/* Image Section */}
              <div className="lg:col-span-2 relative h-64 lg:h-auto">
                <AppImage
                  src={currentTestimonial.image}
                  alt={currentTestimonial.alt}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-body font-medium ${stakeholderColors[currentTestimonial.stakeholder]}`}
                  >
                    {currentTestimonial.stakeholder}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-between">
                <div>
                  <Icon
                    name="ChatBubbleLeftRightIcon"
                    size={48}
                    variant="solid"
                    className="text-primary mb-6"
                  />
                  <blockquote className="font-body text-lg text-foreground leading-relaxed mb-8">
                    "{currentTestimonial.quote}"
                  </blockquote>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-headline font-bold text-xl text-foreground">
                        {currentTestimonial.name}
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        {currentTestimonial.role}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs text-muted-foreground mb-1">
                        {currentTestimonial.metric}
                      </p>
                      <p className="font-headline font-bold text-2xl text-success">
                        {currentTestimonial.metricValue}
                      </p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex ? 'bg-primary w-8' : 'bg-border'
                          }`}
                          aria-label={`Go to testimonial ${index + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={prevSlide}
                        className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center"
                        aria-label="Previous testimonial"
                      >
                        <Icon name="ChevronLeftIcon" size={20} variant="outline" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center"
                        aria-label="Next testimonial"
                      >
                        <Icon name="ChevronRightIcon" size={20} variant="outline" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofCarousel;
