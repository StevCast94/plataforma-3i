import {
  Waves,
  Dumbbell,
  Sparkles,
  UtensilsCrossed,
  Wine,
  ConciergeBell,
  PartyPopper,
  ShieldCheck,
  Car,
  Wifi,
  Umbrella,
  Sparkle,
  type LucideIcon,
} from 'lucide-react';

// Mapa de íconos de línea (lucide) por amenidad/atributo conocido.
// Trazo fino, hereda color vía currentColor — mismo lenguaje visual que TravelIcons.
const AMENITY_ICON: Record<string, LucideIcon> = {
  piscina: Waves,
  piscinas: Waves,
  gimnasio: Dumbbell,
  gym: Dumbbell,
  spa: Sparkles,
  restaurante: UtensilsCrossed,
  bar: Wine,
  'lobby vip': ConciergeBell,
  'áreas sociales': PartyPopper,
  'areas sociales': PartyPopper,
  seguridad: ShieldCheck,
  'seguridad 24h': ShieldCheck,
  parqueo: Car,
  estacionamiento: Car,
  'estacionamiento + cargador ev': Car,
  wifi: Wifi,
  playa: Umbrella,
  'club de playa': Umbrella,
};

export function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = AMENITY_ICON[name.trim().toLowerCase()] ?? Sparkle;
  return <Icon className={className} strokeWidth={1.6} />;
}
