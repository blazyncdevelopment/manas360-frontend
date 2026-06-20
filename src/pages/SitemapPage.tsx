import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const SitemapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <SEO 
        title="Sitemap - MANAS360" 
        description="Navigate through MANAS360 easily with our complete HTML sitemap. Find all the public resources, services, and policies." 
        keywords="sitemap, MANAS360 sitemap, navigate, links" 
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">MANAS360 Sitemap</h1>
        <p className="text-center text-gray-600 mb-12">Looking for something specific? Here is a complete list of our public pages.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Main Services */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Main Offerings</h2>
            <ul className="space-y-3">
              <li><Link to="/" className="text-teal-600 hover:text-teal-800 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-teal-600 hover:text-teal-800 transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="text-teal-600 hover:text-teal-800 transition-colors">How it Works</Link></li>
              <li><Link to="/contact" className="text-teal-600 hover:text-teal-800 transition-colors">Contact Us</Link></li>
              <li><Link to="/specialized-care" className="text-teal-600 hover:text-teal-800 transition-colors">Specialized Care</Link></li>
              <li><Link to="/certifications" className="text-teal-600 hover:text-teal-800 transition-colors">Certifications</Link></li>
            </ul>
          </div>

          {/* Therapy & Programs */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Therapy & Programs</h2>
            <ul className="space-y-3">
              <li><Link to="/premium-theraphy" className="text-teal-600 hover:text-teal-800 transition-colors">Premium Therapy</Link></li>
              <li><Link to="/retreats" className="text-teal-600 hover:text-teal-800 transition-colors">Retreats</Link></li>
              <li><Link to="/corporate-landing" className="text-teal-600 hover:text-teal-800 transition-colors">Corporate Wellbeing</Link></li>
              <li><Link to="/self-help" className="text-teal-600 hover:text-teal-800 transition-colors">Self Help / Guided Programs</Link></li>
              <li><Link to="/find-spark" className="text-teal-600 hover:text-teal-800 transition-colors">Couples Therapy</Link></li>
              <li><Link to="/nri-landing" className="text-teal-600 hover:text-teal-800 transition-colors">NRI Therapy</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Resources</h2>
            <ul className="space-y-3">
              <li><Link to="/blogs" className="text-teal-600 hover:text-teal-800 transition-colors">Blogs & Articles</Link></li>
              <li><Link to="/free-screening" className="text-teal-600 hover:text-teal-800 transition-colors">Free Screening</Link></li>
              <li><Link to="/help-center" className="text-teal-600 hover:text-teal-800 transition-colors">Help Center / Support</Link></li>
              <li><Link to="/plans" className="text-teal-600 hover:text-teal-800 transition-colors">Pricing</Link></li>
              <li><Link to="/crisis" className="text-teal-600 hover:text-teal-800 transition-colors text-red-600 font-medium">Crisis Helpline</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Legal & Policies</h2>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-teal-600 hover:text-teal-800 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-teal-600 hover:text-teal-800 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="text-teal-600 hover:text-teal-800 transition-colors">Refund & Cancellation</Link></li>
              <li><Link to="/cookie-policy" className="text-teal-600 hover:text-teal-800 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/community-guidelines" className="text-teal-600 hover:text-teal-800 transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Portals</h2>
            <ul className="space-y-3">
              <li><Link to="/auth/login" className="text-teal-600 hover:text-teal-800 transition-colors">Patient Login</Link></li>
              <li><Link to="/provider-landing" className="text-teal-600 hover:text-teal-800 transition-colors">For Providers</Link></li>
              <li><Link to="/my-digital-clinic" className="text-teal-600 hover:text-teal-800 transition-colors">My Digital Clinic</Link></li>
              <li><Link to="/corporate/login" className="text-teal-600 hover:text-teal-800 transition-colors">Corporate Login</Link></li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
