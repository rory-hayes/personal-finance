import React from 'react';
import { Construction, Info } from 'lucide-react';

interface PlaceholderCardProps {
  card: any;
}

const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ card }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Construction className="h-8 w-8 text-gray-500" />
      </div>
      
      <h4 className="text-lg font-semibold text-gray-900 mb-2">
        {card.title}
      </h4>
      
      <p className="text-sm text-gray-600 mb-4 max-w-xs">
        This card is coming soon. We're working on building this feature.
      </p>
      
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Info className="h-3 w-3" />
        <span>Card type: {card.type}</span>
      </div>
    </div>
  );
};

export default PlaceholderCard; 