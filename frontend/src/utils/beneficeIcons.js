import {
  Bone, Droplet, Eye, Moon, Flame, Shield,
  Zap, Sparkles, Heart, Leaf,
} from 'lucide-react';

const REGLES = [
  { motsCles: ['articulation', 'genou', 'os'], icone: Bone },
  { motsCles: ['rein', 'urinaire'], icone: Droplet },
  { motsCles: ['œil', 'oeil', 'yeux', 'vue'], icone: Eye },
  { motsCles: ['sommeil', 'dormir', 'nuit'], icone: Moon },
  { motsCles: ['digestion', 'ventre', 'estomac'], icone: Flame },
  { motsCles: ['immun', 'défense'], icone: Shield },
  { motsCles: ['énergie', 'energie', 'tonique'], icone: Zap },
  { motsCles: ['détox', 'detox', 'purifi'], icone: Sparkles },
  { motsCles: ['cœur', 'coeur', 'cardio'], icone: Heart },
];

export function getBeneficeIcon(texte) {
  const t = (texte || '').toLowerCase();
  const regle = REGLES.find((r) => r.motsCles.some((mot) => t.includes(mot)));
  return regle ? regle.icone : Leaf;
}