import Icon from '@/components/ui/AppIcon';

interface FraudPreventionFeatureProps {
  title: string;
  description: string;
  icon: string;
  effectiveness: number;
  technologies: string[];
}

export default function FraudPreventionFeature({ 
  title, 
  description, 
  icon, 
  effectiveness, 
  technologies 
}: FraudPreventionFeatureProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name={icon as any} size={24} variant="outline" className="text-error" />
        </div>
        <div className="flex-1">
          <h3 className="font-headline font-semibold text-lg text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground font-body mb-3">{description}</p>
          
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-body text-muted-foreground">Effectiveness Rate</span>
              <span className="text-sm font-body font-semibold text-success">{effectiveness}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-success rounded-full h-2 transition-all duration-500"
                style={{ width: `${effectiveness}%` }}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-muted rounded text-xs font-body text-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}