import {
  Leaf, Heart, ShieldCheck, Zap, Star, CheckCircle, Award, Clock,
  TrendingUp, Gift, Truck, Lock, Smile, Sparkles, ThumbsUp, Sun,
} from 'lucide-react';

export const ICONES_DISPONIBLES = [
  { cle: 'leaf', Icone: Leaf, label: 'Feuille' },
  { cle: 'heart', Icone: Heart, label: 'Cœur' },
  { cle: 'shield', Icone: ShieldCheck, label: 'Bouclier' },
  { cle: 'zap', Icone: Zap, label: 'Éclair' },
  { cle: 'star', Icone: Star, label: 'Étoile' },
  { cle: 'check', Icone: CheckCircle, label: 'Coche' },
  { cle: 'award', Icone: Award, label: 'Médaille' },
  { cle: 'clock', Icone: Clock, label: 'Horloge' },
  { cle: 'trending', Icone: TrendingUp, label: 'Croissance' },
  { cle: 'gift', Icone: Gift, label: 'Cadeau' },
  { cle: 'truck', Icone: Truck, label: 'Livraison' },
  { cle: 'lock', Icone: Lock, label: 'Sécurité' },
  { cle: 'smile', Icone: Smile, label: 'Sourire' },
  { cle: 'sparkles', Icone: Sparkles, label: 'Étincelles' },
  { cle: 'thumbsup', Icone: ThumbsUp, label: 'Pouce levé' },
  { cle: 'sun', Icone: Sun, label: 'Soleil' },
];

export function getIconeParCle(cle) {
  return ICONES_DISPONIBLES.find((i) => i.cle === cle)?.Icone || CheckCircle;
}