import React from 'react';
import PlaceholderCard from './PlaceholderCard';

export const GoalTimelineCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export const RecentTransactionsCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export const SubscriptionTrackerCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);



export const PeerBenchmarkingCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export const HouseholdContributionsCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export const CashFlowInsightsCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export const AlertsRecommendationsCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export const DashboardCustomizationCard: React.FC<{ card: any; financeData: any }> = ({ card }) => (
  <PlaceholderCard card={card} />
);

export default {
  GoalTimelineCard,
  RecentTransactionsCard,
  SubscriptionTrackerCard,
  PeerBenchmarkingCard,
  HouseholdContributionsCard,
  CashFlowInsightsCard,
  AlertsRecommendationsCard,
  DashboardCustomizationCard,
};
