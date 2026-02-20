import Icon from '@/components/ui/AppIcon';

interface ImpactMetricsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  description: string;
}

export default function ImpactMetricsCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  description 
}: ImpactMetricsCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    stable: 'text-warning'
  };

  const trendIcons = {
    up: 'ArrowTrendingUpIcon',
    down: 'ArrowTrendingDownIcon',
    stable: 'MinusIcon'
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon name={icon as any} size={24} variant="outline" className="text-accent" />
        </div>
        <div className={`flex items-center space-x-1 ${trendColors[trend]}`}>
          <Icon name={trendIcons[trend] as any} size={16} variant="solid" />
          <span className="text-sm font-body font-semibold">{change}</span>
        </div>
      </div>
      
      <h3 className="font-body text-sm text-muted-foreground mb-2">{title}</h3>
      <p className="font-headline text-3xl font-bold text-foreground mb-2">{value}</p>
      <p className="text-xs text-muted-foreground font-body">{description}</p>
    </div>
  );
}