export const themeColors: Record<string, { bg: string; text: string; gradient: string; overlay: string }> = {
  midnight: {
    bg: 'bg-gray-900',
    text: 'text-gray-900',
    gradient: 'from-gray-900 via-gray-800 to-black',
    overlay: 'bg-gradient-to-b from-black/50 via-black/60 to-black/70',
  },
  ocean: {
    bg: 'bg-cyan-700',
    text: 'text-cyan-700',
    gradient: 'from-cyan-900 via-cyan-800 to-teal-900',
    overlay: 'bg-gradient-to-b from-cyan-900/50 via-cyan-900/60 to-cyan-950/70',
  },
  ember: {
    bg: 'bg-orange-700',
    text: 'text-orange-700',
    gradient: 'from-orange-950 via-red-900 to-rose-950',
    overlay: 'bg-gradient-to-b from-red-950/50 via-red-900/60 to-red-950/75',
  },
  forest: {
    bg: 'bg-emerald-800',
    text: 'text-emerald-800',
    gradient: 'from-emerald-950 via-green-900 to-teal-950',
    overlay: 'bg-gradient-to-b from-emerald-950/50 via-emerald-900/60 to-emerald-950/70',
  },
  royal: {
    bg: 'bg-indigo-800',
    text: 'text-indigo-800',
    gradient: 'from-indigo-950 via-purple-900 to-violet-950',
    overlay: 'bg-gradient-to-b from-indigo-950/50 via-purple-900/60 to-violet-950/75',
  },
};

export function getTheme(color: string) {
  return themeColors[color] || themeColors.midnight;
}
