import React from 'react';
import { useNavigate } from 'react-router-dom';
import ServicesCalculator from '../components/ServicesCalculator';
import ArtistsGroomSection from '../components/ArtistsGroomSection';
import LoyaltyMembership from '../components/LoyaltyMembership';

export default function ServicesPage({ selectedArtist, onChooseArtist, onBookGroom, onTokenBooked }) {
  const navigate = useNavigate();

  return (
    <div>
      <ServicesCalculator onTokenBooked={onTokenBooked} />
      <ArtistsGroomSection
        selectedArtist={selectedArtist}
        onChooseArtist={(name) => {
          onChooseArtist(name);
          navigate('/book');
        }}
        onBookGroom={(gp) => {
          onBookGroom(gp);
          navigate('/book');
        }}
      />
      <LoyaltyMembership />
    </div>
  );
}
