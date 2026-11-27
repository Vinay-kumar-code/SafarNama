import { useId, useMemo, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import type { DestinationHub } from '../../types';
import { matchesSearch, normalizeSearch } from '../../lib/utils';

interface DestinationPickerProps {
  destinations: DestinationHub[];
  value: string;
  onChange: (destinationId: string) => void;
  label?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  variant?: 'default' | 'dark';
}

const MAX_SUGGESTIONS = 30;

export function DestinationPicker({
  destinations,
  value,
  onChange,
  label = 'Destination',
  placeholder = 'Search a place or state…',
  optional = false,
  required = false,
  disabled = false,
  name,
  variant = 'default',
}: DestinationPickerProps) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => destinations.find(place => place.id === value),
    [destinations, value],
  );

  const matches = useMemo(() => {
    const terms = normalizeSearch(query).split(' ').filter(Boolean);
    if (!terms.length) return destinations;
    return destinations.filter(place => matchesSearch(terms, place.name, place.state, place.region));
  }, [destinations, query]);

  const shown = matches.slice(0, MAX_SUGGESTIONS);

  return (
    <div className={`sn-dest-picker${variant === 'dark' ? ' sn-dest-picker-dark' : ''}`}>
      <div className="sn-dest-picker-head">
        <label htmlFor={inputId}>{label}{optional ? ' (optional)' : ''}</label>
        {selected && optional && !disabled && (
          <button
            type="button"
            className="sn-community-link"
            onClick={() => { onChange(''); setQuery(''); setOpen(false); }}
          >
            Remove destination
          </button>
        )}
      </div>

      {name && <input type="hidden" name={name} value={value} />}

      {selected && !open ? (
        <div className="sn-dest-selected">
          <div className="sn-dest-selected-info">
            <MapPin size={15} />
            <div>
              <strong>{selected.name}</strong>
              <span>{selected.state}</span>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="sn-button secondary"
              onClick={() => { setOpen(true); setQuery(''); }}
            >
              Change
            </button>
          )}
        </div>
      ) : (
        <div className="sn-dest-search-wrap">
          <div className="sn-dest-search-box">
            <Search size={15} />
            <input
              id={inputId}
              type="search"
              className="sn-field"
              value={query}
              placeholder={placeholder}
              disabled={disabled}
              required={required && !value}
              aria-expanded={open}
              onFocus={() => setOpen(true)}
              onChange={event => { setQuery(event.target.value); setOpen(true); }}
            />
            {query && (
              <button
                type="button"
                className="sn-icon"
                aria-label="Clear destination search"
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {open && !disabled && (
            <div className="sn-dest-dropdown" role="listbox" aria-label="Destination suggestions">
              {shown.length > 0 ? (
                <>
                  {shown.map(place => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={place.id === value}
                      key={place.id}
                      className={`sn-dest-option${place.id === value ? ' active' : ''}`}
                      onClick={() => { onChange(place.id); setQuery(''); setOpen(false); }}
                    >
                      <strong>{place.name}</strong>
                      <span>{place.state}</span>
                    </button>
                  ))}
                  {matches.length > MAX_SUGGESTIONS && (
                    <p className="sn-dest-more">Showing {MAX_SUGGESTIONS} of {matches.length} matches — keep typing to narrow.</p>
                  )}
                </>
              ) : (
                <p className="sn-dest-more">No destinations match "{query}".</p>
              )}
              <button
                type="button"
                className="sn-dest-close"
                onClick={() => setOpen(false)}
              >
                Close list
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
