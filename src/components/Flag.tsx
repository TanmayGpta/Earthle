/* eslint-disable @next/next/no-img-element -- remote SVGs, next/image adds nothing here */
import React from 'react';
import { Country } from '../types/game';
import { flagUrl } from '../lib/game';

interface FlagProps {
  country: Country;
  className?: string;
  // Hide the name from screen readers too when the flag is the question
  conceal?: boolean;
}

// Real flag image; emoji flags render as letter pairs on Windows
export default function Flag({ country, className = '', conceal = false }: FlagProps) {
  return (
    <img
      src={flagUrl(country)}
      alt={conceal ? 'Mystery flag' : `Flag of ${country.name}`}
      draggable={false}
      className={`object-cover ${className}`}
    />
  );
}
