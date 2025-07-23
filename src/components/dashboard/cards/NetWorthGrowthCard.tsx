import React from 'react';
import PlaceholderCard from './PlaceholderCard';

interface NetWorthGrowthCardProps {
  card: any;
  financeData: any;
}

const NetWorthGrowthCard: React.FC<NetWorthGrowthCardProps> = ({ card, financeData }) => {
  return <PlaceholderCard card={card} />;
};

export default NetWorthGrowthCard; 