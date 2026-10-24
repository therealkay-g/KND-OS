'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  CATEGORY_EMOJI,
  KINDU_CENTER,
  getLiveStockSummary,
  getStockFreshness,
  isPlacePending,
  type Place,
} from '@/lib/places';

interface MapViewProps {
  places: Place[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  variant?: 'public' | 'admin';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#039;';
      default:
        return character;
    }
  });
}

function pinHtml(place: Place, variant: 'public' | 'admin'): string {
  const pending = isPlacePending(place);
  const classes = [
    'knd-pin',
    place.pro ? 'is-pro' : '',
    pending ? 'is-pending' : '',
    variant === 'admin' && !pending ? 'is-admin-verified' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<div class="${classes}"><span aria-hidden="true">${CATEGORY_EMOJI[place.category]}</span></div>`;
}

function popupHtml(place: Place, variant: 'public' | 'admin'): string {
  const badge = isPlacePending(place)
    ? '<span class="knd-popup-badge knd-popup-badge-pending">EN ATTENTE</span>'
    : place.pro
      ? '<span class="knd-popup-badge knd-popup-badge-pro">PRO</span>'
      : variant === 'admin'
        ? '<span class="knd-popup-badge knd-popup-badge-verified">VÉRIFIÉ</span>'
        : '';
  const stock = getStockFreshness(place, new Date());
  const stockSummary = stock ? getLiveStockSummary(place, 1) : null;
  const stockLine = stock && stockSummary
    ? `<div class="knd-popup-stock${stock.live ? ' is-live' : ''}">
         <span class="knd-popup-stock-dot" aria-hidden="true"></span>
         <strong>${escapeHtml(stockSummary)}</strong>
         <span>${stock.live ? 'Live' : escapeHtml(stock.label)}</span>
       </div>`
    : '';

  return `
    <div class="knd-popup">
      <div class="knd-popup-category">${escapeHtml(place.category)}</div>
      <div class="knd-popup-name">${escapeHtml(place.name)}</div>
      <div class="knd-popup-meta">
        <span>${escapeHtml(place.commune)}</span>
        <span class="knd-popup-dot" aria-hidden="true"></span>
        <span>${escapeHtml(place.hours)}</span>
        ${badge}
      </div>
      ${stockLine}
      <a class="knd-popup-link" href="/place/${encodeURIComponent(place.id)}">
        Voir la fiche <span aria-hidden="true">→</span>
      </a>
    </div>
  `;
}

export default function MapView({
  places,
  center,
  zoom,
  className = '',
  variant = 'public',
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const initialCenter = useRef<[number, number]>(center ?? KINDU_CENTER);
  const initialZoom = useRef(zoom ?? 13);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: initialCenter.current,
      zoom: initialZoom.current,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (places.length === 0) {
      map.setView(KINDU_CENTER, 12);
      return;
    }

    const bounds = L.latLngBounds([]);

    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          className: 'knd-marker',
          html: pinHtml(place, variant),
          iconSize: [36, 36],
          iconAnchor: [18, 34],
          popupAnchor: [0, -28],
        }),
        title: place.name,
        riseOnHover: true,
      });

      marker.bindPopup(popupHtml(place, variant), {
        maxWidth: 280,
        minWidth: 230,
        closeButton: true,
        autoPanPadding: [24, 24],
      });
      marker.addTo(layer);
      bounds.extend([place.lat, place.lng]);
    }

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 15);
    } else {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(resizeTimer);
  }, [places, variant]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full ${className}`}
      role="region"
      aria-label="Carte des commerces de Kindu"
    />
  );
}
