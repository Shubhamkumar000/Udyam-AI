import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom Logo SVG Icon
export const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
    </svg>
  );
};

const HaloLanding: React.FC = () => {
  const brandList = [
    { name: 'Stripe', style: { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '15px' } },
    { name: 'Coinbase', style: { fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.08em', fontSize: '13px', textTransform: 'uppercase' as const } },
    { name: 'Uniswap', style: { fontFamily: '"Trebuchet MS", sans-serif', fontWeight: 600, letterSpacing: '0.01em', fontSize: '15px', fontStyle: 'italic' } },
    { name: 'Aave', style: { fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: '0.12em', fontSize: '13px', textTransform: 'uppercase' as const } },
    { name: 'Compound', style: { fontFamily: 'Palatino, "Book Antiqua", serif', fontWeight: 400, letterSpacing: '-0.01em', fontSize: '16px' } },
    { name: 'MakerDAO', style: { fontFamily: 'Impact, "Arial Narrow", sans-serif', fontWeight: 400, letterSpacing: '0.04em', fontSize: '14px' } },
    { name: 'Chainlink', style: { fontFamily: 'Verdana, sans-serif', fontWeight: 700, letterSpacing: '-0.03em', fontSize: '13px' } },
  ];

  const backerList = [
    { name: 'Fundamental Labs', style: { fontFamily: '"Times New Roman", serif', fontWeight: 400, letterSpacing: '0.02em', fontSize: '14px' } },
    { name: 'KUCOIN', style: { fontFamily: '"Arial Black", sans-serif', fontWeight: 900, letterSpacing: '0.08em', fontSize: '16px' } },
    { name: 'NGC', style: { fontFamily: 'Impact, sans-serif', fontWeight: 700, letterSpacing: '0.05em', fontSize: '18px' } },
    { name: 'NxGen', style: { fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '17px' } },
    { name: 'Matter Labs', style: { fontFamily: 'Helvetica, sans-serif', fontWeight: 700, letterSpacing: '-0.01em', fontSize: '15px' } },
    { name: 'DEXTools', style: { fontFamily: 'Verdana, sans-serif', fontWeight: 700, letterSpacing: '0.06em', fontSize: '14px', textTransform: 'uppercase' as const } },
    { name: 'NGRAVE', style: { fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: '0.18em', fontSize: '14px' } },
    { name: 'Polychain', style: { fontFamily: 'Palatino, serif', fontWeight: 500, letterSpacing: '0.03em', fontSize: '15px' } },
  ];

  return (
    <div className="flex flex-col bg-[#F5F5F5] min-h-screen text-black overflow-x-hidden">
      {/* SECTION 1: NAVBAR + HERO IN H-SCREEN CONTAINER */}
      <div className="h-screen flex flex-col overflow-hidden relative">
        
        {/* Navbar */}
        <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5 bg-transparent">
          <div className="max-w-[88rem] mx-auto flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-2">
              <LogoIcon className="w-7 h-7 text-black" />
              <span className="text-2xl font-medium tracking-tight text-black font-norms">Halo</span>
            </div>
            
            {/* Center */}
            <div className="hidden md:flex items-center gap-8">
              {['Network', 'Ecosystem', 'Rewards', 'Help', 'News'].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
            </div>
            
            {/* Right Buttons */}
            <div className="flex items-center gap-3">
              {/* Udyan AI Link Button */}
              <Link
                to="/udyan"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm md:text-base font-medium px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                Udyan AI Copilot
              </Link>

              <button className="bg-black text-white text-base font-medium px-7 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200">
                Open Wallet
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 px-6 pt-20 pb-6 flex items-end">
          <div className="relative w-full rounded-2xl overflow-hidden max-w-[88rem] mx-auto" style={{ height: 'calc(100vh - 96px)' }}>
            
            {/* Background Video */}
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-start justify-start h-full p-8 md:p-12 pt-32 md:pt-36 bg-gradient-to-r from-white/30 to-transparent">
              <h1 
                className="text-black text-5xl md:text-7xl font-semibold leading-tight max-w-xl mb-4 font-norms"
                style={{ letterSpacing: '-0.04em', whiteSpace: 'pre-line' }}
              >
                {'Your Wealth\nWorks'}
              </h1>
              
              <p 
                className="text-black/80 text-base md:text-lg max-w-md mb-8 leading-relaxed"
                style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
              >
                An automated, reward-powered digital dollar built for native passive earnings and effortless connection into DeFi.
              </p>

              {/* CTA button */}
              <button className="inline-flex items-center gap-3 bg-black text-white text-base md:text-lg font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200 shadow-lg group mb-8">
                Join us
                <span className="bg-white rounded-full p-2 group-hover:translate-x-1 transition-transform duration-200">
                  <ArrowRight className="w-5 h-5 text-black" />
                </span>
              </button>

              {/* Brand Marquee */}
              <div className="mt-auto w-full max-w-md overflow-hidden bg-white/20 backdrop-blur-md rounded-xl py-3 px-4 border border-white/30">
                <div className="marquee-track">
                  {/* Render once */}
                  {brandList.map((brand, i) => (
                    <span key={`b1-${i}`} className="mx-7 shrink-0 text-black/70 whitespace-nowrap" style={brand.style}>
                      {brand.name}
                    </span>
                  ))}
                  {/* Render twice for seamless loop */}
                  {brandList.map((brand, i) => (
                    <span key={`b2-${i}`} className="mx-7 shrink-0 text-black/70 whitespace-nowrap" style={brand.style}>
                      {brand.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: INFO SECTION ("Meet USD Halo.") */}
      <section className="bg-[#F5F5F5] px-6 py-24 border-t border-gray-200">
        <div className="max-w-[88rem] mx-auto">
          {/* Row 1: 2-col header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
            <div>
              <h2 className="text-black text-5xl md:text-6xl font-semibold leading-tight mb-8 tracking-tight font-norms" style={{ letterSpacing: '-0.03em' }}>
                Meet USD Halo.
              </h2>
              <button className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-7 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200 group">
                Discover it
                <span className="bg-white rounded-full p-1.5 group-hover:translate-x-1 transition-transform duration-200">
                  <ArrowRight className="w-4 h-4 text-black" />
                </span>
              </button>
            </div>
            <div>
              <p className="text-black/70 text-2xl md:text-3xl font-normal leading-relaxed md:pt-2">
                USD Halo is a reward-earning dollar coin that lets your savings grow while remaining tied to the U.S. dollar.
              </p>
            </div>
          </div>

          {/* Row 2: 4-col card grid (actually 3 cards, first spans 2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 (spans 2 cols on lg) */}
            <div 
              className="sm:col-span-2 rounded-2xl overflow-hidden min-h-80 flex flex-col justify-between p-8 text-black relative group shadow-sm border border-gray-200"
              style={{
                backgroundImage: `url('https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Subtle glass overlay */}
              <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
              
              <div className="relative z-10">
                <p className="text-black text-3xl font-semibold leading-snug font-norms" style={{ letterSpacing: '-0.02em' }}>
                  Savings that bloom
                </p>
              </div>
              <div className="relative z-10">
                <p className="text-black/80 text-base max-w-xs leading-relaxed font-sans font-medium bg-white/50 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                  Gain steady returns as your dollar tokens are routed into top-performing DeFi strategies.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#2B2644] rounded-2xl p-8 min-h-80 flex flex-col justify-between shadow-lg text-white hover:scale-[1.01] transition-transform duration-200">
              <div>
                <p className="text-2xl font-semibold leading-snug font-norms whitespace-pre-line">
                  {'Always fluid,\nalways pegged.'}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-base leading-relaxed font-sans">
                  Keep fully dollar-anchored with on-demand access to funds — no lockups or waits.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#2B2644] rounded-2xl p-8 min-h-80 flex flex-col justify-between shadow-lg text-white hover:scale-[1.01] transition-transform duration-200">
              <div>
                <p className="text-2xl font-semibold leading-snug font-norms whitespace-pre-line">
                  {'Fully\nautomated'}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-base leading-relaxed font-sans">
                  Skip the task of tuning positions yourself. USD Halo runs in the background for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: BACKED BY SECTION (marquee row) */}
      <section className="bg-[#F5F5F5] px-6 py-12 border-t border-b border-gray-200">
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          {/* Left col (1/4) */}
          <div className="text-black/70 text-base font-medium leading-relaxed font-norms">
            Funded by premier partners<br />and forward-thinking leaders.
          </div>
          
          {/* Right col (3/4) - marquee */}
          <div className="md:col-span-3 overflow-hidden py-2">
            <div className="backers-track">
              {/* Render once */}
              {backerList.map((backer, i) => (
                <span key={`bk1-${i}`} className="mx-10 shrink-0 text-black/60 whitespace-nowrap" style={backer.style}>
                  {backer.name}
                </span>
              ))}
              {/* Render twice for seamless loop */}
              {backerList.map((backer, i) => (
                <span key={`bk2-${i}`} className="mx-10 shrink-0 text-black/60 whitespace-nowrap" style={backer.style}>
                  {backer.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: USE CASES SECTION */}
      <section className="bg-[#F5F5F5] px-6 py-24">
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
          
          {/* Left column */}
          <div className="flex flex-col justify-center pr-0 md:pr-12 py-6">
            <span className="text-black/60 text-sm font-semibold uppercase tracking-wider mb-2 font-sans">
              USD Halo in Practice
            </span>
            <h2 className="text-5xl md:text-7xl font-semibold leading-none mb-6 font-norms" style={{ letterSpacing: '-0.04em' }}>
              Use modes
            </h2>
            <p className="text-black/60 text-base md:text-lg leading-relaxed max-w-sm font-sans">
              USD Halo powers a wide range of modes for builders, companies and treasuries wanting safe and rewarding stablecoin integrations plus more.
            </p>
          </div>

          {/* Right column */}
          <div className="relative rounded-3xl overflow-hidden min-h-[500px] md:min-h-[720px] flex flex-col justify-end p-8 md:p-12 shadow-lg">
            
            {/* Background Video */}
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Overlay Content */}
            <div className="relative z-10 text-white">
              <h3 className="text-4xl md:text-5xl font-semibold leading-tight mb-5 font-norms" style={{ letterSpacing: '-0.03em' }}>
                Commerce
              </h3>
              
              <p className="text-white/85 text-base md:text-lg max-w-md mb-8 leading-relaxed font-sans">
                Lift customer retention by offering USD Halo, a trusted dollar-backed stablecoin with strong yields, letting your patrons earn with zero effort on your platform.
              </p>

              <a 
                href="#know-more"
                className="inline-flex items-center gap-3 text-white font-medium group hover:text-white/80 transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </span>
                <span className="text-base font-semibold font-norms">Know more</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-6 border-t border-white/10">
        <div className="max-w-[88rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-6 h-6 text-white" />
            <span className="text-xl font-medium tracking-tight font-norms">Halo</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 Halo Foundation. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/udyan" className="text-sm text-gray-400 hover:text-white transition-colors">Udyan AI Dashboard</Link>
            <a href="#privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HaloLanding;
