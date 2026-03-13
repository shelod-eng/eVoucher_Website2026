'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const ROICalculatorSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [averageTransaction, setAverageTransaction] = useState(150);
  const [calculatedResults, setCalculatedResults] = useState({
    newCustomers: 0,
    additionalRevenue: 0,
    totalRevenue: 0,
    revenueIncrease: 0,
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const newCustomers = Math.round(320 * (monthlyRevenue / 50000));
      const additionalRevenue = Math.round(monthlyRevenue * 0.47);
      const totalRevenue = monthlyRevenue + additionalRevenue;
      const revenueIncrease = 47;

      setCalculatedResults({
        newCustomers,
        additionalRevenue,
        totalRevenue,
        revenueIncrease,
      });
    }
  }, [monthlyRevenue, averageTransaction, isHydrated]);

  if (!isHydrated) {
    return (
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="space-y-4">
                  <div className="h-20 bg-muted rounded" />
                  <div className="h-20 bg-muted rounded" />
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
            <Icon name="CalculatorIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">ROI Calculator</span>
          </div>

          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Calculate Your Potential Growth
          </h2>
          <p className="text-lg text-muted-foreground">
            See how much your business could grow with eVoucher. Adjust the sliders to match your
            current business metrics.
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-8 lg:p-12 border border-border">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <label className="flex items-center justify-between mb-3">
                  <span className="text-sm font-headline font-semibold text-foreground">
                    Current Monthly Revenue
                  </span>
                  <span className="text-lg font-headline font-bold text-primary">
                    R{monthlyRevenue?.toLocaleString()}
                  </span>
                </label>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="5000"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e?.target?.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>R10,000</span>
                  <span>R200,000</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between mb-3">
                  <span className="text-sm font-headline font-semibold text-foreground">
                    Average Transaction Value
                  </span>
                  <span className="text-lg font-headline font-bold text-secondary">
                    R{averageTransaction}
                  </span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={averageTransaction}
                  onChange={(e) => setAverageTransaction(Number(e?.target?.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>R50</span>
                  <span>R500</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h4 className="font-headline font-bold text-lg text-foreground mb-4">
                  Calculation Assumptions
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Icon
                      name="CheckCircleIcon"
                      size={16}
                      variant="solid"
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-xs font-body text-muted-foreground">
                      Based on average merchant performance data
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon
                      name="CheckCircleIcon"
                      size={16}
                      variant="solid"
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-xs font-body text-muted-foreground">
                      47% average revenue increase over 6 months
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon
                      name="CheckCircleIcon"
                      size={16}
                      variant="solid"
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-xs font-body text-muted-foreground">
                      320+ new customers per month on average
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon
                      name="CheckCircleIcon"
                      size={16}
                      variant="solid"
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-xs font-body text-muted-foreground">
                      Results may vary based on location and category
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-headline font-bold text-2xl text-foreground mb-6">
                Your Projected Results
              </h3>

              <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-6 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    New Customers Monthly
                  </span>
                  <Icon name="UserGroupIcon" size={24} variant="outline" className="text-success" />
                </div>
                <p className="text-4xl font-headline font-bold text-success mb-1">
                  +{calculatedResults?.newCustomers}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Average new customer acquisition
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Additional Monthly Revenue
                  </span>
                  <Icon
                    name="CurrencyDollarIcon"
                    size={24}
                    variant="outline"
                    className="text-primary"
                  />
                </div>
                <p className="text-4xl font-headline font-bold text-primary mb-1">
                  R{calculatedResults?.additionalRevenue?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Projected revenue increase
                </p>
              </div>

              <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-6 border border-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Total Monthly Revenue
                  </span>
                  <Icon
                    name="TrendingUpIcon"
                    size={24}
                    variant="outline"
                    className="text-secondary"
                  />
                </div>
                <p className="text-4xl font-headline font-bold text-secondary mb-1">
                  R{calculatedResults?.totalRevenue?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Your new projected revenue
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 border border-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Revenue Growth Rate
                  </span>
                  <Icon name="ChartBarIcon" size={24} variant="outline" className="text-accent" />
                </div>
                <p className="text-4xl font-headline font-bold text-accent mb-1">
                  +{calculatedResults?.revenueIncrease}%
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Average growth over 6 months
                </p>
              </div>

              <div className="bg-action/10 rounded-xl p-6 text-center">
                <p className="text-sm font-body text-foreground mb-4">
                  Ready to achieve these results for your business?
                </p>
                <button className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-action text-action-foreground rounded-lg font-headline font-semibold hover:bg-action/90 transition-all duration-300 transform hover:scale-105">
                  <span>Start Your Application</span>
                  <Icon name="ArrowRightIcon" size={20} variant="outline" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculatorSection;
