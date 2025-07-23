import React from 'react';
import PlaceholderCard from './PlaceholderCard';

interface CashFlowForecastCardProps {
  card: any;
  financeData: any;
}

const CashFlowForecastCard: React.FC<CashFlowForecastCardProps> = ({ card, financeData }) => {
  return <PlaceholderCard card={card} />;
};

export default CashFlowForecastCard; 