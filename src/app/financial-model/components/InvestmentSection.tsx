import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface FundingRound {
  id: number;
  round: string;
  amount: string;
  timeline: string;
  purpose: string;
  allocation: AllocationItem[];
}

interface AllocationItem {
  category: string;
  percentage: number;
  amount: string;
}

const InvestmentSection = () => {
  const fundingRounds: FundingRound[] = [
    {
      id: 1,
      round: 'Seed Round',
      amount: 'R 50M',
      timeline: 'Q4 2025',
      purpose: 'Platform development and pilot launch',
      allocation: [
        { category: 'Technology Development', percentage: 50, amount: 'R 25M' },
        { category: 'Pilot Operations', percentage: 30, amount: 'R 15M' },
        { category: 'Team Building', percentage: 20, amount: 'R 10M' }
      ]
    },
    {
      id: 2,
      round: 'Series A',
      amount: 'R 150M',
      timeline: 'Q2 2026',
      purpose: 'Provincial expansion and merchant network',
      allocation: [
        { category: 'Market Expansion', percentage: 40, amount: 'R 60M' },
        { category: 'Technology Scaling', percentage: 35, amount: 'R 52.5M' },
        { category: 'Marketing & Growth', percentage: 25, amount: 'R 37.5M' }
      ]
    },
    {
      id: 3,
      round: 'Series B',
      amount: 'R 300M',
      timeline: 'Q1 2027',
      purpose: 'National rollout and infrastructure',
      allocation: [
        { category: 'National Infrastructure', percentage: 45, amount: 'R 135M' },
        { category: 'Merchant Onboarding', percentage: 30, amount: 'R 90M' },
        { category: 'Government Partnerships', percentage: 25, amount: 'R 75M' }
      ]
    }
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Icon name="BanknotesIcon" size={18} variant="solid" />
            <span className="text-sm font-headline font-semibold">Investment Requirements</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            Funding Strategy & Allocation
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Transparent breakdown of capital requirements and strategic allocation across development phases. Total funding target: <span className="font-bold text-foreground">R 500M</span> over 3 years
          </p>
        </div>

        <div className="space-y-8 mb-12">
          {fundingRounds.map((round) => (
            <div key={round.id} className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-border">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-headline font-bold text-foreground mb-1">
                      {round.round}
                    </h3>
                    <p className="text-sm text-muted-foreground">{round.purpose}</p>
                  </div>
                  <div className="mt-3 md:mt-0 flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-headline font-bold text-primary">
                        {round.amount}
                      </div>
                      <div className="text-sm text-muted-foreground">{round.timeline}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-lg font-headline font-semibold text-foreground mb-4">
                  Fund Allocation
                </h4>
                <div className="space-y-4">
                  {round.allocation.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{item.category}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-success">{item.amount}</span>
                          <span className="text-sm font-bold text-primary">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-success/5 to-primary/5 rounded-xl p-8 border border-success/20">
            <div className="flex items-start space-x-4">
              <div className="bg-success/10 p-3 rounded-lg flex-shrink-0">
                <Icon name="TrophyIcon" size={24} variant="solid" className="text-success" />
              </div>
              <div>
                <h4 className="text-lg font-headline font-bold text-foreground mb-2">
                  Expected Returns
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">32% projected ROI by Year 3</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Break-even achieved in Month 18</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Positive cash flow from Year 2</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Exit opportunities from Year 4</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-8 border border-primary/20">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-headline font-bold text-foreground mb-2">
                  Risk Mitigation
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Diversified revenue streams</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Government partnership backing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Proven market demand</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Scalable technology platform</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-headline font-bold text-foreground mb-2">
              Investment Opportunity
            </h3>
            <p className="text-muted-foreground">
              Join us in building South Africa's leading social impact commerce platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-headline font-bold text-primary mb-1">R 2.4B</div>
              <div className="text-sm text-muted-foreground">Total Market Size</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-headline font-bold text-secondary mb-1">8.5M</div>
              <div className="text-sm text-muted-foreground">Target Beneficiaries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-headline font-bold text-success mb-1">32%</div>
              <div className="text-sm text-muted-foreground">Projected ROI Year 3</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
              <Icon name="DocumentTextIcon" size={20} variant="outline" />
              <span>Request Investment Deck</span>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-card text-foreground border-2 border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300 flex items-center justify-center space-x-2">
              <Icon name="CalendarIcon" size={20} variant="outline" />
              <span>Schedule Discussion</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentSection;