import Icon from '@/components/ui/AppIcon';

interface CTASectionProps {
  onJoinClick?: () => void;
}

const CTASection = ({ onJoinClick }: CTASectionProps) => {
  return (
    <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Icon name="SparklesIcon" size={20} variant="solid" className="text-white" />
            <span className="text-sm font-headline font-semibold text-white">Start Your Journey</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Ready to Start Saving?
          </h2>
          
          <p className="text-lg text-white/90 max-w-3xl mx-auto mb-12">
            Join thousands of South Africans who are taking control of their finances with eVoucher. No smartphone required, no hidden fees—just real savings on essential goods.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              onClick={onJoinClick}
              className="flex items-center space-x-2 px-8 py-4 bg-white text-primary rounded-lg font-headline font-semibold text-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-xl">
              <Icon name="DevicePhoneMobileIcon" size={24} variant="solid" />
              <span>Join Now</span>
            </button>
            
            <button className="flex items-center space-x-2 px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-headline font-semibold text-lg hover:bg-white/10 transition-all duration-300">
              <Icon name="PhoneIcon" size={24} variant="solid" />
              <span>Use USSD: *134*3827#</span>
            </button>
          </div>
          
          {/* Quick Access Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Icon name="DevicePhoneMobileIcon" size={32} variant="solid" className="text-white mx-auto mb-3" />
              <h3 className="font-headline font-bold text-lg text-white mb-2">Smartphone App</h3>
              <p className="text-sm text-white/80">Full features with visual interface</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Icon name="PhoneIcon" size={32} variant="solid" className="text-white mx-auto mb-3" />
              <h3 className="font-headline font-bold text-lg text-white mb-2">USSD Access</h3>
              <p className="text-sm text-white/80">Works on any mobile phone</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Icon name="ChatBubbleLeftRightIcon" size={32} variant="solid" className="text-white mx-auto mb-3" />
              <h3 className="font-headline font-bold text-lg text-white mb-2">SMS Support</h3>
              <p className="text-sm text-white/80">Transaction confirmations & updates</p>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-white/80 mb-4">Trusted by leading organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="flex items-center space-x-2">
                <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-white" />
                <span className="text-sm font-headline font-semibold text-white">POPIA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="LockClosedIcon" size={24} variant="solid" className="text-white" />
                <span className="text-sm font-headline font-semibold text-white">Bank-Grade Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="CheckBadgeIcon" size={24} variant="solid" className="text-white" />
                <span className="text-sm font-headline font-semibold text-white">SARB Regulated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;