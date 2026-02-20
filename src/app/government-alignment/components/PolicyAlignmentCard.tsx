import Icon from '@/components/ui/AppIcon';

interface PolicyAlignmentCardProps {
  title: string;
  description: string;
  icon: string;
  alignmentScore: number;
  programs: string[];
}

export default function PolicyAlignmentCard({ 
  title, 
  description, 
  icon, 
  alignmentScore, 
  programs 
}: PolicyAlignmentCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name={icon as any} size={24} variant="outline" className="text-primary" />
          </div>
          <div>
            <h3 className="font-headline font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-headline font-bold text-success">{alignmentScore}%</span>
          <span className="text-xs text-muted-foreground">Alignment</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-body font-medium text-foreground">Aligned Programs:</p>
        <div className="flex flex-wrap gap-2">
          {programs.map((program, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-muted rounded-full text-xs font-body text-foreground"
            >
              {program}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}