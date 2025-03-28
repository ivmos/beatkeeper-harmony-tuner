
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="pt-6 pb-4 px-4 text-center">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-metro-light-purple bg-clip-text text-transparent">
        BeatKeeper
      </h1>
      <p className="text-muted-foreground mt-2">Your online metronome app</p>
    </header>
  );
};

export default Header;
