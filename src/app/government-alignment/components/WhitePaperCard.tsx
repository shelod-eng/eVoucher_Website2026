import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface WhitePaperCardProps {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  pages: number;
  downloadUrl: string;
  thumbnail: string;
  thumbnailAlt: string;
  category: string;
}

export default function WhitePaperCard({
  title,
  description,
  author,
  publishDate,
  pages,
  downloadUrl,
  thumbnail,
  thumbnailAlt,
  category,
}: WhitePaperCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative h-48 overflow-hidden bg-muted">
        <AppImage src={thumbnail} alt={thumbnailAlt} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-body font-semibold">
            {category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-headline font-semibold text-lg text-foreground mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-3">{description}</p>

        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Icon name="UserIcon" size={14} variant="outline" />
              <span className="font-body">{author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="DocumentTextIcon" size={14} variant="outline" />
              <span className="font-body">{pages} pages</span>
            </div>
          </div>
          <span className="font-body">{publishDate}</span>
        </div>

        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-body font-semibold hover:bg-secondary/90 transition-colors duration-200">
          <Icon name="ArrowDownTrayIcon" size={16} variant="outline" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  );
}
