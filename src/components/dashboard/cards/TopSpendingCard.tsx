import React from 'react';
import PlaceholderCard from './PlaceholderCard';

interface TopSpendingCardProps {
  card: any;
  financeData: any;
}

const TopSpendingCard: React.FC<TopSpendingCardProps> = ({ card, financeData }) => {
  return <PlaceholderCard card={card} />;
};

export default TopSpendingCard; 