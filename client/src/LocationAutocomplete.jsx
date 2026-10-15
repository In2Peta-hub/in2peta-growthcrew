import React, { useEffect, useId, useRef, useState } from 'react';
import { suggestIndiaLocations } from './indiaLocations';

const FIELD =
  'w-full bg-[#07080b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60 focus:ring-2 focus:ring-[#FF6B4A]/15 transition-all disabled:opacity-50';

/**
 * Location autocomplete for GrowthCrew outreach. Curated India locations show
 * instantly (offline); worldwide suggestions always come from OSM Nominatim
 * (no API key). The chosen string is what the search payload uses.
 */
export default function LocationAutocomplete({
  id,
  value,
  onChange,
  disabled = false,
  className = FIELD,
  placeholder = 'City, state/region, country',
}) {
  const listId = useId();
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [localItems, setLocalItems] = useState([]);
  const [remoteItems, setRemoteItems] = useState([]);
  const [remoteNote, setRemoteNote] = useState(false);

  const items = (() => {
    const seen = new Set();
    const merged = [];
    for (const label of [...localItems, ...remoteItems]) {
      if (!label || seen.has(label)) continue;
      seen.add(label);
      merged.push(label);
      if (merged.length >= 8) break;
    }
    return merged;
  })();

  useEffect(() => {
    const q = value.trim();
    const local = suggestIndiaLocations(q, 8).map((row) => row.label);
    setLocalItems(local);
    setActiveIndex(local.length ? 0 : -1);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setRemoteItems([]);
    setRemoteNote(false);

    // Worldwide OSM Nominatim suggestions (debounced); the curated India
    // locations above are instant and offline.
    if (q.length < 3) return undefined;

    debounceRef.current = window.setTimeout(async () => {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(q)}`;
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const data = await response.json();
        const labels = (Array.isArray(data) ? data : [])
          .map((hit) => formatNominatim(hit))
          .filter(Boolean);
        setRemoteItems(labels);
        setRemoteNote(labels.length > 0);
        if (labels.length && local.length === 0) setActiveIndex(0);
      } catch {
        // Offline or blocked — local suggestions still work
      }
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    const onDoc = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function select(label) {
    onChange(label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp') && items.length) {
      setOpen(true);
      setActiveIndex(0);
      event.preventDefault();
      return;
    }
    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(items.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      select(items[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  }

  const showList = open && items.length > 0 && value.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-[#10141c] py-1 shadow-2xl"
        >
          {items.map((label, index) => (
            <li
              key={label}
              id={`${listId}-opt-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3.5 py-2 text-xs transition-colors ${
                index === activeIndex
                  ? 'bg-[#FFA84A]/15 text-white'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                select(label);
              }}
            >
              {label}
            </li>
          ))}
          {remoteNote && (
            <li className="border-t border-white/[0.06] px-3.5 py-1.5 text-[10px] text-slate-500" role="presentation">
              Some results © OpenStreetMap
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function formatNominatim(hit) {
  const address = hit?.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.county ||
    hit?.name ||
    '';
  const state = address.state || '';
  const country = address.country || '';
  if (!city) return '';
  if (state && country) return `${city}, ${state}, ${country}`;
  if (country) return `${city}, ${country}`;
  return city;
}
