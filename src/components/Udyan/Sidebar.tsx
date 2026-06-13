import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ScanLine, 
  MessageSquareCode, 
  Briefcase, 
  Globe, 
  ArrowLeft
} from 'lucide-react';
import { LogoIcon } from '../../pages/UdyanLanding';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { name: 'Dashboard', path: '/udyan', icon: LayoutDashboard },
    { name: 'AI License Scanner', path: '/udyan/scanner', icon: ScanLine },
    { name: 'AI Compliance Chat', path: '/udyan/chat', icon: MessageSquareCode },
    { name: 'Business Profile', path: '/udyan/profile', icon: Briefcase },
    { name: 'Chrome Extension', path: '/udyan/extension', icon: Globe },
  ];

  return (
    <aside className="w-80 bg-white text-gray-800 min-h-screen flex flex-col border-r border-gray-200 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg text-white">
            <LogoIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black font-norms">UDYAN AI</h1>
            <p className="text-[10px] text-gray-500 font-medium font-sans">COMPLIANCE COPILOT</p>
          </div>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-500 hover:text-black hover:bg-gray-100/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
              <span className="font-norms">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Health Status */}
      <div className="p-4 m-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-gray-700">Sarvam AI Online</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-normal">
          Udyan Autofill Engine loaded. Forms autofill matching enabled for 5 portals.
        </p>
      </div>

      {/* Back to Landing Page Link */}
      <div className="p-4 border-t border-gray-200">
        <Link 
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black transition-colors py-2 px-4 rounded-lg hover:bg-gray-100/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home Page
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
