import React from 'react';
import { useNavigate } from 'react-router-dom';
import LookFinder from '../components/LookFinder';
import AiStudioMirror from '../components/AiStudioMirror';
import BridalJourney from '../components/BridalJourney';
import BrideSuiteExtra from '../components/BrideSuiteExtra';

export default function BridalPage({ onSelectLookForBooking, onJourneyUpdate }) {
  const navigate = useNavigate();

  const handleBookFromBridal = (lookData) => {
    onSelectLookForBooking(lookData);
    navigate('/book');
  };

  return (
    <div>
      <LookFinder onBookLook={handleBookFromBridal} />
      <AiStudioMirror onApplyRecommendation={handleBookFromBridal} />
      <BridalJourney onJourneyUpdate={onJourneyUpdate} />
      <BrideSuiteExtra
        onBookNail={(nail) => handleBookFromBridal({ packageName: 'Party Makeup', price: nail.price })}
      />
    </div>
  );
}
