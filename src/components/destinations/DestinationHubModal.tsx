import React from 'react';
import { useApp } from '../../context/AppContext';
import { DestinationDetailView } from './DestinationDetailView';

export const DestinationHubModal: React.FC = () => {
  const { activeDestination, setActiveDestination } = useApp();

  if (!activeDestination) return null;

  return (
    <DestinationDetailView
      destination={activeDestination}
      onClose={() => setActiveDestination(null)}
      isStandalonePage={false}
    />
  );
};
