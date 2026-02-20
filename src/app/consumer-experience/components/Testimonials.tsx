import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface TestimonialData {
  name: string;
  location: string;
  image: string;
  alt: string;
  quote: string;
  savings: string;
  duration: string;
}

const Testimonials = () => {
  const testimonials: TestimonialData[] = [
  {
    name: 'Nomsa Dlamini',
    location: 'Soweto, Johannesburg',
    image: "https://images.unsplash.com/photo-1720338363849-abed9c6a0672",
    alt: 'Smiling middle-aged Black woman in colorful traditional dress with shopping bags in township market',
    quote: 'eVoucher has changed my life. I save over R800 every month on groceries. That money now goes to my children\'s school fees. The USSD system is so easy—I don\'t even need a smartphone!',
    savings: 'R847',
    duration: 'per month'
  },
  {
    name: 'Thabo Mokoena',
    location: 'Alexandra, Johannesburg',
    image: "https://images.unsplash.com/photo-1630541643139-a554fe61d3fe",
    alt: 'Elderly Black man in blue collared shirt smiling while using basic mobile phone outdoors',
    quote: 'At 67 years old, I thought digital payments were too complicated. But eVoucher works on my old phone. I just dial the code and buy vouchers. My pension goes much further now.',
    savings: 'R623',
    duration: 'per month'
  },
  {
    name: 'Zanele Khumalo',
    location: 'Khayelitsha, Cape Town',
    image: "https://images.unsplash.com/photo-1694105465706-ac892b0bf7a4",
    alt: 'Young Black woman in yellow headwrap and traditional attire smiling confidently at camera',
    quote: 'As a single mother of three, every rand counts. eVoucher helps me stretch my budget. The savings tracker shows me exactly how much I\'ve saved—it\'s empowering to see that number grow!',
    savings: 'R1,012',
    duration: 'per month'
  }];


  return (
    <section className="bg-gradient-to-br from-muted via-background to-primary/5 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-secondary/10 rounded-full mb-6">
            <Icon name="ChatBubbleLeftRightIcon" size={20} variant="solid" className="text-secondary" />
            <span className="text-sm font-headline font-semibold text-secondary">Community Voices</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Real People,<br />
            <span className="text-primary">Real Savings</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from South Africans who are transforming their financial futures with eVoucher
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) =>
          <div
            key={index}
            className="bg-card rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">

              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <AppImage
                src={testimonial.image}
                alt={testimonial.alt}
                className="w-full h-full object-cover" />

                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent"></div>
                
                {/* Savings Badge */}
                <div className="absolute bottom-4 left-4 bg-success text-success-foreground rounded-lg px-4 py-2 shadow-lg">
                  <p className="text-xs font-body">Monthly Savings</p>
                  <p className="text-2xl font-headline font-bold">{testimonial.savings}</p>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="UserCircleIcon" size={28} variant="solid" className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg text-foreground">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center space-x-1">
                      <Icon name="MapPinIcon" size={14} variant="solid" />
                      <span>{testimonial.location}</span>
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <Icon name="ChatBubbleLeftIcon" size={32} variant="solid" className="absolute -top-2 -left-2 text-primary/20" />
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6 italic">
                    "{testimonial.quote}"
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckBadgeIcon" size={20} variant="solid" className="text-success" />
                    <span className="text-xs font-body text-muted-foreground">Verified User</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) =>
                  <Icon key={star} name="StarIcon" size={16} variant="solid" className="text-secondary" />
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Community Impact Statement */}
        <div className="mt-16 bg-card rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-headline font-bold text-2xl text-foreground mb-4">
                Join 250,000+ South Africans Saving with Dignity
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every day, thousands of families across South Africa use eVoucher to stretch their budgets further. From townships to rural communities, we're creating pathways to financial empowerment—one voucher at a time.
              </p>
              <button className="flex items-center space-x-2 px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold text-lg hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Icon name="RocketLaunchIcon" size={24} variant="solid" />
                <span>Start Saving Today</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-xl p-6 text-center">
                <Icon name="HeartIcon" size={32} variant="solid" className="text-error mx-auto mb-3" />
                <p className="text-3xl font-headline font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">User Satisfaction</p>
              </div>
              <div className="bg-muted rounded-xl p-6 text-center">
                <Icon name="TrophyIcon" size={32} variant="solid" className="text-secondary mx-auto mb-3" />
                <p className="text-3xl font-headline font-bold text-foreground">4.8/5</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div className="bg-muted rounded-xl p-6 text-center">
                <Icon name="UserGroupIcon" size={32} variant="solid" className="text-primary mx-auto mb-3" />
                <p className="text-3xl font-headline font-bold text-foreground">250K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="bg-muted rounded-xl p-6 text-center">
                <Icon name="ArrowTrendingUpIcon" size={32} variant="solid" className="text-success mx-auto mb-3" />
                <p className="text-3xl font-headline font-bold text-foreground">R2.1M</p>
                <p className="text-sm text-muted-foreground">Total Savings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default Testimonials;