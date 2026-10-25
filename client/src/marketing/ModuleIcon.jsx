import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { MODULE_ICONS } from './moduleIcons';

export const ModuleIcon = ({ id, size = 18, ...props }) => {
  const Icon = MODULE_ICONS[id] || LayoutGrid;
  return <Icon size={size} aria-hidden="true" {...props} />;
};
