import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2,
  Flame,
  FileText,
  Utensils,
  Receipt,
  Briefcase,
  Factory,
  Pill,
  MapPin,
} from 'lucide-react';
import type { BusinessProfile } from '../../utils/udyanStorage';

// @ts-ignore — Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export type OfficeId =
  | 'business'
  | 'fire'
  | 'ghmc'
  | 'fssai'
  | 'gst'
  | 'labour'
  | 'spcb'
  | 'drug';

interface RegulatoryOffice {
  id: OfficeId;
  name: string;
  authority: string;
  address: string;
  lat: number;
  lng: number;
  icon: React.ReactNode;
  color: string;
}

type OfficeTemplate = Omit<RegulatoryOffice, 'icon'>;

/** Hardcoded Hyderabad centre */
const HYDERABAD_CENTER: [number, number] = [17.385, 78.4867];

const HYDERABAD_OFFICES: OfficeTemplate[] = [
  {
    id: 'fire',
    name: 'Fire NOC Office',
    authority: 'Telangana State Fire Services',
    address: 'DG Office, Basheerbagh, Hyderabad 500029',
    lat: 17.3992,
    lng: 78.4766,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    id: 'ghmc',
    name: 'GHMC Trade License',
    authority: 'Greater Hyderabad Municipal Corporation',
    address: 'GHMC Head Office, Khairatabad, Hyderabad 500004',
    lat: 17.4156,
    lng: 78.4696,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: 'fssai',
    name: 'FSSAI State Office',
    authority: 'Food Safety & Standards Authority (Telangana)',
    address: 'Erragadda, Balanagar, Hyderabad 500018',
    lat: 17.456,
    lng: 78.418,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'gst',
    name: 'GST Seva Kendra',
    authority: 'Goods & Services Tax Network',
    address: 'Ameerpet, Hyderabad 500016',
    lat: 17.4375,
    lng: 78.4482,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    id: 'labour',
    name: 'Labour & Shop Establishment',
    authority: 'Telangana Dept. of Labour',
    address: 'Labour Commissionerate, Ameerpet, Hyderabad 500016',
    lat: 17.437,
    lng: 78.448,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 'spcb',
    name: 'Pollution Control Board',
    authority: 'Telangana State Pollution Control Board',
    address: 'Parisaram, Sanathnagar, Hyderabad 500018',
    lat: 17.4438,
    lng: 78.4466,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  {
    id: 'drug',
    name: 'Drug Control Department',
    authority: 'Telangana Drugs Control Administration',
    address: 'DM&HO Office, Koti, Hyderabad 500095',
    lat: 17.3856,
    lng: 78.4869,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

const OFFICE_ICONS: Record<OfficeId, React.ReactNode> = {
  business: <Building2 className="w-4 h-4" />,
  fire: <Flame className="w-4 h-4" />,
  ghmc: <FileText className="w-4 h-4" />,
  fssai: <Utensils className="w-4 h-4" />,
  gst: <Receipt className="w-4 h-4" />,
  labour: <Briefcase className="w-4 h-4" />,
  spcb: <Factory className="w-4 h-4" />,
  drug: <Pill className="w-4 h-4" />,
};

function buildOfficeList(profile: BusinessProfile | null): RegulatoryOffice[] {
  const businessOffice: RegulatoryOffice = {
    id: 'business',
    name: 'Your Business',
    authority: profile?.business_name || 'Registered Business',
    address:
      [profile?.address, 'Hyderabad', 'Telangana', profile?.pincode || '500001']
        .filter(Boolean)
        .join(', '),
    lat: HYDERABAD_CENTER[0],
    lng: HYDERABAD_CENTER[1],
    icon: OFFICE_ICONS.business,
    color: 'text-black bg-gray-50 border-gray-300',
  };

  return [
    businessOffice,
    ...HYDERABAD_OFFICES.map((o) => ({ ...o, icon: OFFICE_ICONS[o.id] })),
  ];
}

interface RegulatoryOfficeMapProps {
  profile: BusinessProfile | null;
}

const RegulatoryOfficeMap: React.FC<RegulatoryOfficeMapProps> = ({ profile }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<OfficeId>('business');

  const offices = useMemo(() => buildOfficeList(profile), [profile]);
  const selectedOffice = offices.find((o) => o.id === selectedOfficeId) ?? offices[0];

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(HYDERABAD_CENTER, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedOffice) return;

    map.flyTo([selectedOffice.lat, selectedOffice.lng], selectedOffice.id === 'business' ? 13 : 14, {
      duration: 1.2,
    });

    markerRef.current?.remove();
    markerRef.current = L.marker([selectedOffice.lat, selectedOffice.lng])
      .addTo(map)
      .bindPopup(
        `<b>${selectedOffice.name}</b><br><span style="font-size:11px;color:#666">${selectedOffice.authority}</span><br><span style="font-size:11px">${selectedOffice.address}</span>`
      )
      .openPopup();
  }, [selectedOffice, profile]);

  return (
    <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Regulatory Office Locator
        </h2>
        <span className="text-[10px] text-gray-500 font-mono bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
          Region: Hyderabad, Telangana
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-h-[280px] bg-gray-100 rounded-xl relative overflow-hidden border border-gray-200">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-xl z-0" />
          <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-600 font-semibold pointer-events-none">
            <span className="text-black font-bold">{selectedOffice.name}</span>
            {' · '}
            {selectedOffice.address}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <p className="text-xs font-bold text-gray-800">Select Office to View</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Hyderabad regulatory authorities</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[280px] p-2 space-y-1.5">
            {offices.map((office, idx) => {
              const isActive = office.id === selectedOfficeId;
              return (
                <motion.button
                  key={office.id}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedOfficeId(office.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? `${office.color} border-current shadow-sm ring-2 ring-offset-1 ring-black/10`
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? office.color : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {office.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isActive ? '' : 'text-gray-800'}`}>
                        {office.name}
                      </p>
                      <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">
                        {office.authority}
                      </p>
                    </div>
                    {isActive && (
                      <motion.span
                        layoutId="office-active-dot"
                        className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryOfficeMap;
