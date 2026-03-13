import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSkeleton } from './components/LoadingSkeleton';

// Route-level code splitting
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const AnimeDetails = lazy(() => import('./pages/AnimeDetails'));
const MyWatchlist = lazy(() => import('./pages/MyWatchlist'));
const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-anime-bg text-anime-text font-sans selection:bg-anime-primary/30">
        <Navbar />
        <main className="pt-20">
          <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
              <LoadingSkeleton count={12} />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/anime/:id" element={<AnimeDetails />} />
              <Route path="/watchlist" element={<MyWatchlist />} />
              <Route path="/watch/:id/:ep" element={<VideoPlayer />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="bg-anime-800/50 backdrop-blur-md text-anime-muted py-10 text-center mt-20 border-t border-white/5">
          <div className="container mx-auto px-4 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4 group cursor-default">
              <img src="/logo1.png" alt="AnimePh Logo" className="w-12 h-12 object-contain group-hover:rotate-12 transition-transform duration-500" />
              <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-anime-primary to-anime-secondary">AnimePh</p>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} AnimePh. All rights reserved.</p>
          </div>
        </footer>
      </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
