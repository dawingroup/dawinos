import { useState } from 'react';
import Header from './components/Header';
import QuickActions from './components/QuickActions';
import Settings from './components/Settings';
import SignInScreen from './components/SignInScreen';
import LoadingScreen from './components/LoadingScreen';
import { ClipGallery } from './components/ClipGallery';
import { ClipDetail } from './components/ClipDetail';
import { useAuth } from './hooks/useAuth';
import { useClips } from './hooks/useClips';
import type { ClipRecord } from '../types/database';

type View = 'gallery' | 'detail' | 'settings';

export default function App() {
  const { user, isLoading: authLoading, signIn, signOut } = useAuth();
  const { clips, pendingCount, syncClips, deleteClip, updateClip } = useClips();
  const [currentView, setCurrentView] = useState<View>('gallery');
  const [selectedClip, setSelectedClip] = useState<ClipRecord | null>(null);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <SignInScreen onSignIn={signIn} />;
  }

  const handleStartClipping = async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      await chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_CLIPPING_MODE' });
      window.close();
    }
  };

  const handleSelectClip = (clip: ClipRecord) => {
    setSelectedClip(clip);
    setCurrentView('detail');
  };

  const handleBackToGallery = () => {
    setSelectedClip(null);
    setCurrentView('gallery');
  };

  const handleBulkAction = async (action: 'delete' | 'tag' | 'project', ids: string[]) => {
    if (action === 'delete') {
      for (const id of ids) {
        await deleteClip(id);
      }
    }
    // TODO: Implement tag and project bulk actions
  };

  return (
    <div className="w-[400px] h-[500px] bg-gray-50 flex flex-col">
      {currentView !== 'detail' && (
        <>
          <Header
            user={user}
            pendingCount={pendingCount}
            onSettingsClick={() => setCurrentView(currentView === 'settings' ? 'gallery' : 'settings')}
            onSignOut={signOut}
          />

          <QuickActions
            onStartClipping={handleStartClipping}
            onSyncNow={syncClips}
          />
        </>
      )}

      <main className="flex-1 overflow-hidden">
        {currentView === 'gallery' && (
          <ClipGallery
            clips={clips}
            onDelete={deleteClip}
            onSelect={handleSelectClip}
            onBulkAction={handleBulkAction}
          />
        )}
        {currentView === 'detail' && selectedClip && (
          <ClipDetail
            clip={selectedClip}
            onBack={handleBackToGallery}
            onUpdate={updateClip}
            onDelete={(id) => {
              deleteClip(id);
              handleBackToGallery();
            }}
          />
        )}
        {currentView === 'settings' && (
          <Settings onBack={() => setCurrentView('gallery')} />
        )}
      </main>
    </div>
  );
}
