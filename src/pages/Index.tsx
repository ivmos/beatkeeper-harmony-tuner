
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MetronomeControl from '@/components/MetronomeControl';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-metro-dark-blue to-black">
      <Header />
      
      <main className="flex-1 flex justify-center items-center p-4">
        <div className="w-full max-w-xl bg-secondary/20 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-metro-purple/20">
          <MetronomeControl />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
