import React from 'react';
import BookingFlow from '../components/BookingFlow';
import ChatbotDemo from '../components/ChatbotDemo';

export default function BookPage({ preselectedLook, selectedArtist, onBookingSuccess }) {
  return (
    <div>
      <BookingFlow
        preselectedLook={preselectedLook}
        selectedArtist={selectedArtist}
        onBookingSuccess={onBookingSuccess}
      />
      <ChatbotDemo
        onJumpToBook={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onLeadSaved={onBookingSuccess}
      />
    </div>
  );
}
