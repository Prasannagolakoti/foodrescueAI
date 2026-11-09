import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';

// Views
import HomeView from './views/HomeView';
import AvailableFoodView from './views/AvailableFoodView';
import DonateFoodView from './views/DonateFoodView';
import RequestFoodView from './views/RequestFoodView';
import SmartMatchingView from './views/SmartMatchingView';
import MapView from './views/MapView';
import DonationHistoryView from './views/DonationHistoryView';
import NotificationsView from './views/NotificationsView';
import ChatbotView from './views/ChatbotView';
import AnalyticsView from './views/AnalyticsView';
import UserProfileView from './views/UserProfileView';
import AdminDashboardView from './views/AdminDashboardView';
import AuthView from './views/AuthView';

// Modals
import FoodDetailModal from './components/modals/FoodDetailModal';
import RequestFoodModal from './components/modals/RequestFoodModal';
import RateDonorModal from './components/modals/RateDonorModal';
import ReportIssueModal from './components/modals/ReportIssueModal';
import RouteMapModal from './components/modals/RouteMapModal';
import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal';

import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { MessageSquare, HeartHandshake } from 'lucide-react';

export default function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [refreshKey, setRefreshKey] = useState(0);

  // Floating Chatbot State
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Modals State
  const [selectedDonationForDetail, setSelectedDonationForDetail] = useState(null);
  const [selectedDonationForRequest, setSelectedDonationForRequest] = useState(null);
  const [selectedDonationForRating, setSelectedDonationForRating] = useState(null);
  const [selectedTargetForReport, setSelectedTargetForReport] = useState(null);

  // Interactive Route Map Modal State (Feature 2)
  const [selectedDonationForMap, setSelectedDonationForMap] = useState(null);
  const [selectedReceiverForMap, setSelectedReceiverForMap] = useState(null);

  // Donor Food Deletion Modal State (Feature 4)
  const [donationToDelete, setDonationToDelete] = useState(null);

  const handleOpenDetail = (donation) => {
    setSelectedDonationForDetail(donation);
  };

  const handleOpenRequest = (donation) => {
    if (!user) {
      alert('Please sign in or select a demo role to request food donations.');
      setCurrentView('auth');
      return;
    }
    setSelectedDonationForRequest(donation);
  };

  const handleOpenRating = (donation) => {
    setSelectedDonationForRating(donation);
  };

  const handleOpenReport = (target) => {
    setSelectedTargetForReport(target);
  };

  // Open Interactive Route Map between Recipient and Donor
  const handleOpenMap = (donation, targetReceiver = null) => {
    setSelectedDonationForMap(donation);
    setSelectedReceiverForMap(targetReceiver);
  };

  // Open Donor Food Deletion Confirmation
  const handleOpenDelete = (donation) => {
    setDonationToDelete(donation);
  };

  const handleConfirmDelete = async (id) => {
    await api.deleteDonation(id);
    setRefreshKey((prev) => prev + 1);
    if (selectedDonationForDetail && selectedDonationForDetail.id === id) {
      setSelectedDonationForDetail(null);
    }
    alert('Food donation listing successfully removed from active availability. Any recipients with active requests have been notified.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Global Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1" key={refreshKey}>
        {currentView === 'home' && (
          <HomeView
            setCurrentView={setCurrentView}
            onViewDetails={handleOpenDetail}
            onRequestFood={handleOpenRequest}
            onOpenMap={handleOpenMap}
            onDeleteFood={handleOpenDelete}
          />
        )}

        {currentView === 'available-food' && (
          <AvailableFoodView
            onViewDetails={handleOpenDetail}
            onRequestFood={handleOpenRequest}
            onOpenMap={handleOpenMap}
            onDeleteFood={handleOpenDelete}
          />
        )}

        {currentView === 'donate' && (
          <DonateFoodView
            setCurrentView={setCurrentView}
            onSuccessDonation={() => {
              setRefreshKey((prev) => prev + 1);
              setCurrentView('available-food');
            }}
          />
        )}

        {currentView === 'requests' && (
          <RequestFoodView
            onOpenRateModal={handleOpenRating}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'smart-matching' && (
          <SmartMatchingView
            onRequestFood={handleOpenRequest}
            onViewDetails={handleOpenDetail}
            onOpenMap={handleOpenMap}
          />
        )}

        {currentView === 'map' && (
          <MapView
            onViewDetails={handleOpenDetail}
            onRequestFood={handleOpenRequest}
          />
        )}

        {currentView === 'history' && (
          <DonationHistoryView
            onOpenRateModal={handleOpenRating}
            onViewDetails={handleOpenDetail}
            onOpenMap={handleOpenMap}
            onDeleteFood={handleOpenDelete}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView />
        )}

        {currentView === 'chatbot' && (
          <ChatbotView />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView />
        )}

        {currentView === 'profile' && (
          <UserProfileView />
        )}

        {currentView === 'admin' && (
          <AdminDashboardView />
        )}

        {currentView === 'auth' && (
          <AuthView
            onAuthSuccess={(loggedInUser) => {
              const role = (loggedInUser?.role || '').toLowerCase();
              if (role === 'admin') {
                setCurrentView('admin');
              } else if (role === 'donor') {
                setCurrentView('donate');
              } else if (role === 'recipient' || role === 'receiver') {
                setCurrentView('available-food');
              } else {
                setCurrentView('home');
              }
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />

      {/* Floating Chatbot Bubble & Widget */}
      {!chatbotOpen && (
        <button
          onClick={() => setChatbotOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group"
          title="Open AI Food Rescue Chatbot (English & తెలుగు)"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
            Chat with AI (తెలుగు / Eng)
          </span>
        </button>
      )}

      <ChatbotWidget
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onExpandFull={() => {
          setChatbotOpen(false);
          setCurrentView('chatbot');
        }}
      />

      {/* Global Modals */}
      <FoodDetailModal
        donation={selectedDonationForDetail}
        onClose={() => setSelectedDonationForDetail(null)}
        onRequest={handleOpenRequest}
        onReport={handleOpenReport}
        onOpenMap={handleOpenMap}
        onDeleteFood={handleOpenDelete}
        userRole={user?.role}
      />

      <RequestFoodModal
        donation={selectedDonationForRequest}
        onClose={() => setSelectedDonationForRequest(null)}
        onSuccess={() => {
          setSelectedDonationForRequest(null);
          setCurrentView('requests');
        }}
        user={user}
      />

      <RateDonorModal
        donation={selectedDonationForRating}
        onClose={() => setSelectedDonationForRating(null)}
        onSuccess={() => {
          setSelectedDonationForRating(null);
        }}
      />

      <ReportIssueModal
        target={selectedTargetForReport}
        onClose={() => setSelectedTargetForReport(null)}
        onSuccess={() => {
          setSelectedTargetForReport(null);
          alert('Report submitted to admin team. Thank you.');
        }}
      />

      {/* Feature 2: Interactive Route Map Modal */}
      <RouteMapModal
        isOpen={Boolean(selectedDonationForMap)}
        onClose={() => {
          setSelectedDonationForMap(null);
          setSelectedReceiverForMap(null);
        }}
        donation={selectedDonationForMap}
        targetReceiver={selectedReceiverForMap}
        currentUser={user}
      />

      {/* Feature 4: Donor Food Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(donationToDelete)}
        onClose={() => setDonationToDelete(null)}
        donation={donationToDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
