export const STATUS_CONFIG = {
  backlog:     { color: 'gray',   label: 'Backlog',      icon: '📋' },
  proposed:    { color: 'blue',   label: 'Propuesta',    icon: '💡' },
  ready:       { color: 'yellow', label: 'Lista',        icon: '✅' },
  in_progress: { color: 'orange', label: 'En progreso',  icon: '⚙️' },
  review:      { color: 'violet', label: 'Revisión',     icon: '👀' },
  done:        { color: 'green',  label: 'Hecho',        icon: '🎉' },
  error:       { color: 'red',    label: 'Error',        icon: '❌' },
};

// Legacy aliases for compatibility
export const STATUS_COLORS = {
  backlog:     { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   dot: 'bg-gray-400'   },
  proposed:    { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
  ready:       { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500'  },
  in_progress: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  review:      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
  done:        { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  dot: 'bg-green-500'  },
  error:       { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500'    },
};

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
);

export const ALL_STATUSES = ['backlog', 'proposed', 'ready', 'in_progress', 'review', 'done', 'error'];
