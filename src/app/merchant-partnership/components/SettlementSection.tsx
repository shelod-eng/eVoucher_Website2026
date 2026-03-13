import React from 'react';
import Icon from '@/components/ui/AppIcon';

const SettlementSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full">
              <Icon name="BanknotesIcon" size={20} variant="solid" />
              <span className="text-sm font-headline font-semibold">Transparent Settlement</span>
            </div>

            <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground">
              Reliable Payment Systems You Can Trust
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              We understand that cash flow is critical for your business. That's why we've built a
              settlement system that prioritizes speed, transparency, and reliability.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-4 bg-card rounded-lg p-4 border border-border">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="ClockIcon" size={20} variant="outline" className="text-success" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-foreground mb-1">
                    Same-Day Settlement
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">
                    Funds transferred to your bank account within 24 hours of voucher redemption. No
                    waiting periods.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-card rounded-lg p-4 border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon
                    name="DocumentTextIcon"
                    size={20}
                    variant="outline"
                    className="text-primary"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-foreground mb-1">
                    Detailed Transaction Reports
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">
                    Access comprehensive reports showing every transaction, settlement amount, and
                    fee breakdown.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-card rounded-lg p-4 border border-border">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon
                    name="ShieldCheckIcon"
                    size={20}
                    variant="outline"
                    className="text-secondary"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-foreground mb-1">
                    Fraud Protection Guarantee
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">
                    Every transaction is verified and protected. If fraud occurs, you're covered by
                    our guarantee.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-card rounded-lg p-4 border border-border">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon
                    name="CurrencyDollarIcon"
                    size={20}
                    variant="outline"
                    className="text-accent"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-foreground mb-1">
                    No Hidden Fees
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">
                    Transparent pricing with no surprise charges. You keep 70% of every voucher
                    value redeemed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <h3 className="font-headline font-bold text-2xl text-foreground mb-6">
              Settlement Breakdown
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Voucher Face Value
                  </span>
                  <span className="text-lg font-headline font-bold text-foreground">R100.00</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Merchant Receives (70%)
                  </span>
                  <span className="text-lg font-headline font-bold text-success">R70.00</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '70%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Consumer Savings (30%)
                  </span>
                  <span className="text-lg font-headline font-bold text-secondary">R30.00</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-body font-semibold text-foreground">
                    Settlement Timeline
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span className="text-xs font-body text-muted-foreground">
                      Voucher Redeemed: 09:00 AM
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-xs font-body text-muted-foreground">
                      Transaction Verified: 09:05 AM
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    <span className="text-xs font-body text-muted-foreground">
                      Funds Transferred: Next Day 10:00 AM
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-success/10 text-success px-4 py-3 rounded-lg">
                <Icon name="CheckCircleIcon" size={20} variant="solid" />
                <span className="text-sm font-body font-semibold">
                  Guaranteed 24-Hour Settlement
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettlementSection;
