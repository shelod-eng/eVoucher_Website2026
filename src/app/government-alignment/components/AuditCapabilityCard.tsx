import Icon from '@/components/ui/AppIcon';

interface AuditCapabilityCardProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
  accessLevel: string;
}

export default function AuditCapabilityCard({ 
  title, 
  description, 
  icon, 
  features, 
  accessLevel 
}: AuditCapabilityCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-14 h-14 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name={icon as any} size={28} variant="outline" className="text-secondary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-headline font-semibold text-lg text-foreground">{title}</h3>
            <span className="px-3 py-1 bg-trust-builder/10 text-trust-builder rounded-full text-xs font-body font-semibold">
              {accessLevel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-body">{description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Icon name="CheckCircleIcon" size={16} variant="solid" className="text-success flex-shrink-0" />
            <span className="text-sm font-body text-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}