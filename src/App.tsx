import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from './components/SplashScreen';
import { Dashboard } from './components/Dashboard';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <Dashboard key="dashboard" />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
