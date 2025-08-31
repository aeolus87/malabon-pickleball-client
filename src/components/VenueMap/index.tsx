import React, { useEffect, useRef } from 'react';

interface VenueMapProps {
  latitude: number;
  longitude: number;
  venueName: string;
  isOpen: boolean;
  onClose: () => void;
}

const VenueMap: React.FC<VenueMapProps> = ({ latitude, longitude, venueName, isOpen, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Load Leaflet CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    script.onload = () => {
      // @ts-ignore - Leaflet is loaded dynamically
      const L = window.L;
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create map instance
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 16);

      // Add satellite tile layer
      L.tileLayer('https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(mapInstanceRef.current);

      // Add marker with venue name
      const marker = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
      
      // Add popup with venue name
      marker.bindPopup(`<b>${venueName}</b><br>Click for directions`).openPopup();

      // Add click handler to open in Google Maps
      marker.on('click', () => {
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
      });

      // Fit map to marker
      mapInstanceRef.current.fitBounds(marker.getLatLng().toBounds(100));
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude, venueName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {venueName} - Satellite View
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div 
            ref={mapRef}
            className="w-full h-96 sm:h-[500px] bg-gray-100 dark:bg-gray-700 rounded-lg"
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="font-medium">Interactive Satellite Map</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
            <div className="flex gap-2 mt-3">
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                Open in Google Maps
              </a>
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Open in OSM
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
