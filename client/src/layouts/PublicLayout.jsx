import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DemoBanner from '../components/DemoBanner';

function ScrollToHash() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a tick so the section exists after data loads.
      const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash, search]);
  return null;
}

export default function PublicLayout() {
  return (
    <>
      <DemoBanner />
      <Navbar />
      <ScrollToHash />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
