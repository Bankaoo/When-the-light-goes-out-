import React, { useState } from 'react';
import { ParkState, SceneId, RideId } from './types';
import { AudioHeader } from './components/AudioHeader';
import { SceneIntro } from './components/SceneIntro';
import { SceneEntrance } from './components/SceneEntrance';
import { SceneCarousel } from './components/SceneCarousel';
import { SceneCoaster } from './components/SceneCoaster';
import { SceneFerris } from './components/SceneFerris';
import { SceneFinal } from './components/SceneFinal';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  const [parkState, setParkState] = useState<ParkState>({
    carousel: { ridden: false, shutdown: false },
    coaster: { ridden: false, shutdown: false },
    ferris: { ridden: false, shutdown: false },
    currentScene: 'INTRO',
    previousScene: null,
    audioStarted: false,
  });

  const handleStartGame = () => {
    setParkState((prev) => ({
      ...prev,
      currentScene: 'PARK_MAIN',
      audioStarted: true,
    }));
  };

  const handleSelectRide = (ride: RideId) => {
    let nextScene: SceneId = 'PARK_MAIN';
    if (ride === 'carousel') nextScene = 'CAROUSEL_APPROACH';
    if (ride === 'coaster') nextScene = 'COASTER_APPROACH';
    if (ride === 'ferris') nextScene = 'FERRIS_APPROACH';

    setParkState((prev) => ({
      ...prev,
      previousScene: prev.currentScene,
      currentScene: nextScene,
    }));
  };

  const handleReturnToPark = () => {
    setParkState((prev) => ({
      ...prev,
      previousScene: prev.currentScene,
      currentScene: 'PARK_MAIN',
    }));
  };

  const handleCarouselShutdown = () => {
    setParkState((prev) => ({
      ...prev,
      carousel: { ridden: true, shutdown: true },
    }));
  };

  const handleCoasterShutdown = () => {
    setParkState((prev) => ({
      ...prev,
      coaster: { ridden: true, shutdown: true },
    }));
  };

  const handleFerrisShutdown = () => {
    setParkState((prev) => ({
      ...prev,
      ferris: { ridden: true, shutdown: true },
    }));
  };

  const handleProceedToQuietEnding = () => {
    setParkState((prev) => ({
      ...prev,
      previousScene: prev.currentScene,
      currentScene: 'FINAL_DARKNESS',
    }));
  };

  const handleRestart = () => {
    // Reset park state and restart waltz audio
    soundEngine.startCarouselWaltz();
    setParkState({
      carousel: { ridden: false, shutdown: false },
      coaster: { ridden: false, shutdown: false },
      ferris: { ridden: false, shutdown: false },
      currentScene: 'PARK_MAIN',
      previousScene: null,
      audioStarted: true,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none">
      {/* Outer Game Cabinet / Cinema Frame (16:9 Aspect Ratio) */}
      <div className="w-full max-w-5xl flex flex-col items-center">
        {/* Top Header with subtle state info & mute toggle */}
        {parkState.currentScene !== 'INTRO' && (
          <AudioHeader parkState={parkState} />
        )}

        {/* 16:9 Fixed-Aspect Game Display */}
        <div className="relative w-full aspect-video bg-[#030408] rounded-sm overflow-hidden border-2 border-[#1a2138] shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
          {/* Subtle scanline and vignette styling */}
          <div className="absolute inset-0 scanlines-overlay z-20 pointer-events-none opacity-40" />

          {/* Active Scene Router */}
          {parkState.currentScene === 'INTRO' && (
            <SceneIntro onStart={handleStartGame} />
          )}

          {parkState.currentScene === 'PARK_MAIN' && (
            <SceneEntrance
              parkState={parkState}
              onSelectRide={handleSelectRide}
              onProceedToEnding={handleProceedToQuietEnding}
            />
          )}

          {parkState.currentScene === 'CAROUSEL_APPROACH' && (
            <SceneCarousel
              isAlreadyShutdown={parkState.carousel.shutdown}
              onCompleteShutdown={handleCarouselShutdown}
              onReturnToPark={handleReturnToPark}
            />
          )}

          {parkState.currentScene === 'COASTER_APPROACH' && (
            <SceneCoaster
              isAlreadyShutdown={parkState.coaster.shutdown}
              carouselShutdown={parkState.carousel.shutdown}
              ferrisShutdown={parkState.ferris.shutdown}
              onCompleteShutdown={handleCoasterShutdown}
              onReturnToPark={handleReturnToPark}
            />
          )}

          {parkState.currentScene === 'FERRIS_APPROACH' && (
            <SceneFerris
              isAlreadyShutdown={parkState.ferris.shutdown}
              onCompleteShutdown={handleFerrisShutdown}
              onReturnToPark={handleReturnToPark}
              onProceedToQuietEnding={handleProceedToQuietEnding}
            />
          )}

          {parkState.currentScene === 'FINAL_DARKNESS' && (
            <SceneFinal onRestart={handleRestart} />
          )}
        </div>

        {/* Quiet footer */}
        <footer className="w-full text-center py-2 text-[10px] text-slate-600 font-['VT323'] tracking-widest">
          A quiet interactive story · Use mouse to explore & close the park
        </footer>
      </div>
    </div>
  );
}
