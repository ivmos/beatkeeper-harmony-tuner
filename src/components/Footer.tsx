
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-4 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} BeatKeeper - A Professional Metronome App</p>
      <p className="mt-1">Keep your rhythm perfect with BeatKeeper.</p>
    </footer>
  );
};

export default Footer;
