import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface HeroSectionProps {
  className?: string;
  onJoinClick?: () => void;
}

const HeroSection = ({ className = '', onJoinClick }: HeroSectionProps) => {
  return (
    <section
      className={`relative bg-gradient-to-br from-primary/10 via-background to-secondary/5 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-accent/10 rounded-full">
              <Icon name="SparklesIcon" size={20} variant="solid" className="text-accent" />
              <span className="text-sm font-headline font-semibold text-accent">
                Dignified Savings for Every South African
              </span>
            </div>

            <h1 className="font-headline font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
              Real Savings,
              <br />
              <span className="text-primary">Real Dignity</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Access exclusive discounts on essential goods from trusted merchants. Save up to 30%
              on groceries, airtime, and daily necessities—no smartphone required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onJoinClick}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold text-lg hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Icon name="DevicePhoneMobileIcon" size={24} variant="solid" />
                <span>Join Now</span>
              </button>

              <button className="flex items-center justify-center space-x-2 px-8 py-4 bg-card text-foreground border-2 border-border rounded-lg font-headline font-semibold text-lg hover:bg-muted transition-all duration-300">
                <Icon name="PlayCircleIcon" size={24} variant="solid" className="text-primary" />
                <span>Watch How It Works</span>
              </button>
            </div>

            {/* USSD Quick Access */}
            <div className="flex items-center space-x-4 p-6 bg-card rounded-xl border-2 border-primary/20 shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="PhoneIcon" size={24} variant="solid" className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-body text-muted-foreground">
                  No smartphone? No problem!
                </p>
                <p className="text-2xl font-headline font-bold text-foreground">Dial *134*3827#</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <AppImage
                src="https://images.unsplash.com/photo-1720338363849-abed9c6a0672"
                alt="Smiling South African woman in colorful traditional dress holding shopping bags in township market"
                className="w-full h-[500px] object-cover"
              />

              {/* Floating Stats Cards */}
              <div className="absolute top-6 right-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <Icon
                      name="CheckCircleIcon"
                      size={24}
                      variant="solid"
                      className="text-success"
                    />
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-bold text-foreground">R847</p>
                    <p className="text-xs text-muted-foreground">Avg. Monthly Savings</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="UserGroupIcon" size={24} variant="solid" className="text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-bold text-foreground">250K+</p>
                    <p className="text-xs text-muted-foreground">Active Users</p>
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

export default HeroSection;
