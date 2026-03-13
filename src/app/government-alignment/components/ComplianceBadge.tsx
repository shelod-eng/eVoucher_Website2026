import Icon from '@/components/ui/AppIcon';

interface ComplianceBadgeProps {
  name: string;
  acronym: string;
  status: 'certified' | 'pending' | 'compliant';
  certificationDate: string;
  expiryDate: string;
  icon: string;
}

export default function ComplianceBadge({
  name,
  acronym,
  status,
  certificationDate,
  expiryDate,
  icon,
}: ComplianceBadgeProps) {
  const statusColors = {
    certified: 'bg-success/10 text-success border-success/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    compliant: 'bg-accent/10 text-accent border-accent/20',
  };

  const statusLabels = {
    certified: 'Certified',
    pending: 'Pending Review',
    compliant: 'Fully Compliant',
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name={icon as any} size={32} variant="outline" className="text-primary" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-foreground">{acronym}</h3>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-body font-semibold border ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground font-body">Certified</p>
          <p className="font-body font-semibold text-foreground">{certificationDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-body">Valid Until</p>
          <p className="font-body font-semibold text-foreground">{expiryDate}</p>
        </div>
      </div>
    </div>
  );
}
