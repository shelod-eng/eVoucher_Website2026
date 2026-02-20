import Icon from '@/components/ui/AppIcon';

const DiscountBreakdown = () => {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-success/10 rounded-full mb-6">
            <Icon name="CalculatorIcon" size={20} variant="solid" className="text-success" />
            <span className="text-sm font-headline font-semibold text-success">Transparent Savings</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            How Your Savings Work
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Every voucher purchase creates a 30% discount. Here's exactly how the savings are distributed to maximize your benefit.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          {/* Visual Split Representation */}
          <div className="bg-card rounded-2xl shadow-xl p-8 lg:p-12 mb-12">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Consumer Benefit */}
              <div className="relative">
                <div className="bg-gradient-to-br from-success/20 to-success/5 rounded-xl p-8 border-2 border-success/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                        <Icon name="UserIcon" size={24} variant="solid" className="text-success" />
                      </div>
                      <h3 className="font-headline font-bold text-2xl text-foreground">You Save</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-headline font-bold text-success">70%</p>
                      <p className="text-sm text-muted-foreground">of discount</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success mt-1" />
                      <div>
                        <p className="font-headline font-semibold text-foreground">Direct Savings</p>
                        <p className="text-sm text-muted-foreground">Instant discount applied at checkout</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success mt-1" />
                      <div>
                        <p className="font-headline font-semibold text-foreground">No Hidden Fees</p>
                        <p className="text-sm text-muted-foreground">What you see is what you save</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success mt-1" />
                      <div>
                        <p className="font-headline font-semibold text-foreground">Trackable Impact</p>
                        <p className="text-sm text-muted-foreground">Monitor total savings over time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Platform & Merchant */}
              <div className="relative">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-8 border-2 border-primary/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-primary" />
                      </div>
                      <h3 className="font-headline font-bold text-2xl text-foreground">Platform</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-headline font-bold text-primary">30%</p>
                      <p className="text-sm text-muted-foreground">of discount</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-primary mt-1" />
                      <div>
                        <p className="font-headline font-semibold text-foreground">Merchant Support</p>
                        <p className="text-sm text-muted-foreground">Free loyalty infrastructure</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-primary mt-1" />
                      <div>
                        <p className="font-headline font-semibold text-foreground">Platform Operations</p>
                        <p className="text-sm text-muted-foreground">Technology & security maintenance</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-primary mt-1" />
                      <div>
                        <p className="font-headline font-semibold text-foreground">Growth Investment</p>
                        <p className="text-sm text-muted-foreground">Expanding merchant network</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Example Calculation */}
          <div className="bg-muted rounded-xl p-8">
            <h3 className="font-headline font-bold text-2xl text-foreground mb-6 text-center">
              Real Example: Grocery Shopping
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg p-6 text-center">
                <Icon name="ShoppingCartIcon" size={32} variant="solid" className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">Original Price</p>
                <p className="text-3xl font-headline font-bold text-foreground">R1 000</p>
              </div>
              
              <div className="bg-card rounded-lg p-6 text-center border-2 border-success">
                <Icon name="ReceiptPercentIcon" size={32} variant="solid" className="text-success mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">Your Savings (21%)</p>
                <p className="text-3xl font-headline font-bold text-success">R210</p>
              </div>
              
              <div className="bg-card rounded-lg p-6 text-center">
                <Icon name="BanknotesIcon" size={32} variant="solid" className="text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">You Pay</p>
                <p className="text-3xl font-headline font-bold text-primary">R790</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-center text-foreground">
                <Icon name="InformationCircleIcon" size={16} variant="solid" className="inline text-accent mr-2" />
                That's <span className="font-headline font-bold text-accent">R210 back in your pocket</span> for every R1,000 spent on essentials
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountBreakdown;