import React from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">


      <main className="flex-grow">
        {children || <Outlet />}
      </main>

      {/* <footer className="no-print bg-white border-t border-slate-100 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-serif text-lg mb-1 text-slate-800 font-bold">MANAS360</p>
          <p className="text-xs text-slate-400">© 2024 Certification Platform. Professional Demo.</p>
        </div>
      </footer> */}
    </div>
  );
};

export default Layout;
