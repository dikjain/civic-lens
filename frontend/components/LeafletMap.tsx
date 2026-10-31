"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Spot = { lat: number; lng: number; count: number };
type Props = { center: [number, number]; zoom?: number; pin?: [number, number]; onPick?: (lat: number, lng: number) => void; spots?: Spot[]; height?: number };

export default function LeafletMap({ center, zoom = 14, pin, onPick, spots, height = 260 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current).setView(center, zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    if (onPick) m.on("click", (e: L.LeafletMouseEvent) => onPick(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)));
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    if (pin) { L.circleMarker(pin, { radius: 9, color: "#0f766e", fillColor: "#0f766e", fillOpacity: 0.9 }).addTo(layer.current); map.current.panTo(pin); }
    if (spots?.length) {
      spots.forEach(s => L.circleMarker([s.lat, s.lng], { radius: 8 + s.count * 4, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.35 })
        .bindTooltip(`${s.count} report(s)`).addTo(layer.current!));
      map.current.fitBounds(L.latLngBounds(spots.map(s => [s.lat, s.lng] as [number, number])).pad(0.3));
    }
  }, [pin?.[0], pin?.[1], spots]);

  return <div ref={el} className="map" style={{ height }} data-testid="leaflet-map" />;
}
