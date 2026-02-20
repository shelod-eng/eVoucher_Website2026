import Icon from '@/components/ui/AppIcon';

interface TransparencyToolCardProps {
  title: string;
  description: string;
  icon: string;
  dataPoints: Array<{
    label: string;
    value: string;
  }>;
  updateFrequency: string;
}

export default function TransparencyToolCard({ 
  title, 
  description, 
  icon, 
  dataPoints, 
  updateFrequency 
}: TransparencyToolCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name={icon as any} size={24} variant="outline" className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-headline font-semibold text-lg text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground font-body mb-3">{description}</p>
          
          <div className="space-y-3 mb-4">
            {dataPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-body text-muted-foreground">{point.label}</span>
                <span className="text-sm font-body font-semibold text-foreground">{point.value}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="ClockIcon" size={14} variant="outline" />
            <span className="font-body">Updated {updateFrequency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}