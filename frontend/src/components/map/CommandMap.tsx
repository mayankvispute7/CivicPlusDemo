'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident, GeoJSONCollection } from '@/types';
import { SEVERITY_COLORS, MAP_CENTER, MAP_ZOOM } from '@/lib/constants';
import { api } from '@/services/api';

interface CommandMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentSelect: (incident: Incident) => void;
}

const LAYERS_CONFIG = [
  { key: 'incidents', label: 'Incidents', checked: true },
  { key: 'drainage', label: 'Drainage', checked: true },
  { key: 'roads', label: 'Roads', checked: false },
  { key: 'infrastructure', label: 'Infrastructure', checked: true },
];

export default function CommandMap({ incidents, selectedIncident, onIncidentSelect }: CommandMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const infraMarkersRef = useRef<L.LayerGroup | null>(null);
  const [layers, setLayers] = useState<Record<string, boolean>>({
    incidents: true,
    drainage: true,
    roads: false,
    infrastructure: true,
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    // Standard OpenStreetMap tiles (we will invert them in CSS for dark mode)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap · CartoDB' }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    infraMarkersRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Load infrastructure GeoJSON
    loadInfrastructure(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update incident markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    if (!layers.incidents) return;

    incidents.forEach((inc) => {
      const color = SEVERITY_COLORS[inc.severity] || '#6b7280';
      const isSelected = selectedIncident?.id === inc.id;
      const isPrimary = inc.incident_id === 'INC-1042';
      const size = isSelected ? 20 : isPrimary ? 16 : 12;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.6)'};
          box-shadow: 0 0 ${isSelected ? '16px' : '8px'} ${color}80;
          cursor: pointer;
          ${isPrimary || isSelected ? 'animation: marker-pulse 2s ease-in-out infinite;' : ''}
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon })
        .bindPopup(`
          <div style="min-width:180px">
            <div style="font-size:10px;color:#9aa0b4;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px">
              ${inc.incident_id}
            </div>
            <div style="font-size:13px;font-weight:600;margin-bottom:6px">${inc.title}</div>
            <div style="display:flex;gap:12px;font-size:11px;color:#9aa0b4">
              <span>Severity: <b style="color:${color}">${inc.severity}</b></span>
              <span>Rainfall: <b>${inc.rainfall_mm || '—'}mm</b></span>
            </div>
            ${inc.nearby_asset_id ? `<div style="font-size:11px;color:#9aa0b4;margin-top:4px">Asset: <b>${inc.nearby_asset_id}</b></div>` : ''}
          </div>
        `)
        .on('click', () => onIncidentSelect(inc));

      markersRef.current!.addLayer(marker);
    });
  }, [incidents, selectedIncident, onIncidentSelect, layers.incidents]);

  // Pan to selected incident
  useEffect(() => {
    if (!mapRef.current || !selectedIncident) return;
    mapRef.current.panTo([selectedIncident.latitude, selectedIncident.longitude], { animate: true, duration: 0.5 });
  }, [selectedIncident]);

  async function loadInfrastructure(map: L.Map) {
    try {
      const geojson = await api.infrastructure.geojson();
      if (!geojson?.features) return;

      geojson.features.forEach((feature: any) => {
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const isDrain = props.asset_type === 'STORMWATER_DRAIN';
        const isRoad = props.asset_type === 'ROAD_SEGMENT';

        if (!layers.infrastructure && !isDrain) return;
        if (!layers.drainage && isDrain) return;

        const condColor = props.condition === 'CAPACITY_CONSTRAINED' ? '#ca8a04'
          : props.condition === 'DEGRADED' ? '#ea580c'
          : props.condition === 'CRITICAL' ? '#ef4444'
          : props.condition === 'GOOD' ? '#22c55e'
          : '#3b82f6';

        const size = isDrain ? 10 : 8;
        const shape = isDrain ? '◆' : isRoad ? '▬' : '●';

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background: ${condColor};
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: ${isDrain ? '2px' : '50%'};
            transform: ${isDrain ? 'rotate(45deg)' : 'none'};
            opacity: 0.8;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="min-width:160px">
              <div style="font-size:10px;color:#9aa0b4;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:2px">
                ${props.asset_id}
              </div>
              <div style="font-size:13px;font-weight:600;margin-bottom:6px">${props.name}</div>
              <div style="font-size:11px;color:#9aa0b4;margin-bottom:2px">
                Condition: <b style="color:${condColor}">${props.condition?.replace('_', ' ')}</b>
              </div>
              <div style="font-size:11px;color:#9aa0b4;margin-bottom:2px">
                Capacity: <b>${props.capacity_rating?.toFixed(0) || '—'}%</b>
              </div>
              <div style="font-size:11px;color:#9aa0b4">
                Last maintenance: <b>${props.maintenance_days_ago || '—'} days ago</b>
              </div>
            </div>
          `);

        infraMarkersRef.current!.addLayer(marker);
      });
    } catch (err) {
      console.error('Failed to load infrastructure:', err);
    }
  }

  function toggleLayer(key: string) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Layer controls */}
      <div className="map-layer-control">
        <h3>Map Layers</h3>
        {LAYERS_CONFIG.map((layer) => (
          <label key={layer.key} className="layer-toggle">
            <input
              type="checkbox"
              checked={layers[layer.key]}
              onChange={() => toggleLayer(layer.key)}
            />
            {layer.label}
          </label>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 52,
          left: 12,
          zIndex: 1000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 10,
        }}
      >
        <div style={{ fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', marginBottom: 4 }}>
          Severity
        </div>
        {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {level}
          </div>
        ))}
      </div>
    </div>
  );
}
