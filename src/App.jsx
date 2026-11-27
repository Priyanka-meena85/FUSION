import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import FooterNav from './components/FooterNav';
import HomePage from './pages/HomePage';
import BridalPage from './pages/BridalPage';
import ServicesPage from './pages/ServicesPage';
import GalleryPage from './pages/GalleryPage';
import BookPage from './pages/BookPage';
import ReviewsPage from './pages/ReviewsPage';
import AdminPage from './pages/AdminPage';
import ContactPage from './pages/ContactPage';
import { CssCrown } from './components/CssIcons';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const [curtainVisible, setCurtainVisible] = useState(true);
  const [preselectedLook, setPreselectedLook] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState('Riya Sen');
  const [adminRefresh, setAdminRefresh] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainVisible(false), 1350);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectLookForBooking = (lookData) => {
    setPreselectedLook({ ...lookData, _ts: Date.now() });
  };

  const handleBookGroom = (gp) => {
    setSelectedArtist('Arjun Mehta');
    setPreselectedLook({ packageName: 'Groom Package', price: gp.price, _ts: Date.now() });
  };

  const triggerAdminRefresh = () => setAdminRefresh((n) => n + 1);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#0B0B0C] relative">
        {curtainVisible && (
          <div className="fixed inset-0 z-50 pointer-events-none flex overflow-hidden">
            <div className="curtain-left w-1/2 h-full bg-gradient-to-r from-[#0B0B0C] via-[#3B0A10] to-[#9E1B2B] border-r-2 border-[#D4AF37] flex items-center justify-end pr-4">
              <span className="font-display text-xl sm:text-3xl font-bold text-[#D4AF37] tracking-widest">
                FUSION
              </span>
            </div>
            <div className="curtain-right w-1/2 h-full bg-gradient-to-l from-[#0B0B0C] via-[#3B0A10] to-[#9E1B2B] border-l-2 border-[#D4AF37] flex items-center justify-start pl-4">
              <span className="font-display text-sm sm:text-xl text-[#FAF6F0]/90 tracking-[0.25em] uppercase inline-flex items-center gap-2">
                <CssCrown className="text-[#D4AF37]" /> MIRROR
              </span>
            </div>
          </div>
        )}

        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  preselectedLook={preselectedLook}
                  selectedArtist={selectedArtist}
                  onSelectLookForBooking={handleSelectLookForBooking}
                  onChooseArtist={setSelectedArtist}
                  onBookGroom={handleBookGroom}
                  onBookingSuccess={triggerAdminRefresh}
                />
              }
            />
            <Route
              path="/bridal"
              element={
                <BridalPage
                  onSelectLookForBooking={handleSelectLookForBooking}
                  onJourneyUpdate={triggerAdminRefresh}
                />
              }
            />
            <Route
              path="/services"
              element={
                <ServicesPage
                  selectedArtist={selectedArtist}
                  onChooseArtist={setSelectedArtist}
                  onBookGroom={handleBookGroom}
                  onTokenBooked={triggerAdminRefresh}
                />
              }
            />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route
              path="/book"
              element={
                <BookPage
                  preselectedLook={preselectedLook}
                  selectedArtist={selectedArtist}
                  onBookingSuccess={triggerAdminRefresh}
                />
              }
            />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/admin" element={<AdminPage refreshTrigger={adminRefresh} />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>

        <FooterNav />
      </div>
    </BrowserRouter>
  );
}
