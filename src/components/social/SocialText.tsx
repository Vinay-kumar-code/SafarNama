import { useId, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';

export const travelStickers = {
  Mountains: '⛰️', 'Beach day': '🏖️', 'Food stop': '🍲', Heritage: '🏛️', 'On the road': '🛺', 'Hidden gem': '💎',
} as const;

const emojiGroups = [
  {
    id: 'reactions',
    label: 'Reactions',
    items: ['😊', '😍', '🤩', '🥳', '😎', '🥹', '😂', '🥰', '🙌', '👏', '🙏', '❤️', '🧡', '💛', '💚', '🔥', '✨', '💯', '👍', '🎉', '🫶', '💫', '🌟', '✌️'],
  },
  {
    id: 'travel',
    label: 'Travel',
    items: ['📍', '🗺️', '🧭', '🧳', '🎒', '📸', '🚂', '🚌', '🚕', '🛺', '🛵', '✈️', '⛵', '🛶', '⛺', '🏕️', '🏨', '🏛️', '🕌', '🛕', '⛪', '🏰', '🌉', '🎫'],
  },
  {
    id: 'nature',
    label: 'Nature',
    items: ['🌄', '🌅', '🌆', '🌃', '⛰️', '🏔️', '🌋', '🏝️', '🏖️', '🏜️', '🌲', '🌿', '🪷', '🌺', '🌊', '💧', '❄️', '☀️', '🌤️', '🌈', '🌧️', '🌙', '🦚', '🐘'],
  },
  {
    id: 'food',
    label: 'Food',
    items: ['🍛', '🍲', '🥘', '🍚', '🥟', '🥙', '🍢', '🍧', '🍨', '🥭', '🥥', '🍋', '☕', '🫖', '🥤', '🧃', '🍽️', '🌶️', '🧇', '🍰', '🍉', '🍌', '🥜', '🍯'],
  },
] as const;

const allEmojis = emojiGroups.flatMap(group => group.items);

export function listTags(text: string) {
  return [...text.matchAll(/(?:^|[^\p{L}\p{N}_@#])#([\p{L}\p{N}_]{1,32})/gu)].map(match => match[1].toLowerCase());
}

export function RichText({ text }: { text: string }) {
  const { profiles, openProfile, openTopic } = useSocial();
  const fragments = [];
  let cursor = 0;
  for (const match of text.matchAll(/(^|[^\p{L}\p{N}_@#])([@#])([\p{L}\p{N}_]{1,32})/gu)) {
    const start = match.index + match[1].length;
    const end = match.index + match[0].length;
    const tag = match[3].toLowerCase();
    const people = match[2] === '@' ? profiles.filter(person => person.username.toLowerCase() === tag) : [];
    const link = match[2] === '#' ? () => openTopic(tag) : people.length === 1 ? () => openProfile(people[0].id) : undefined;
    fragments.push(text.slice(cursor, start));
    fragments.push(link ? <button type="button" className="sn-social-token" onClick={link} key={start}>{text.slice(start, end)}</button>
      : text.slice(start, end));
    cursor = end;
  }
  return <>{fragments}{text.slice(cursor)}</>;
}

export function SocialTextInput({ label, value, change, limit, rows = 3, placeholder, disabled, autoFocus }: {
  label: string; value: string; change: (value: string) => void; limit: number; rows?: number;
  placeholder?: string; disabled?: boolean; autoFocus?: boolean;
}) {
  const { profiles } = useSocial();
  const [picking, setPicking] = useState(false);
  const [group, setGroup] = useState<'all' | typeof emojiGroups[number]['id']>('all');
  const [caret, setCaret] = useState(-1);
  const input = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const active = caret >= 0 ? /(?:^|[^\w@])@([a-z0-9_]{0,24})$/i.exec(value.slice(0, caret)) : null;
  const people = !disabled && active ? profiles.filter(person => {
    const handle = person.username.toLowerCase();
    return /^[a-z0-9_]{1,24}$/.test(handle) && handle.startsWith(active[1].toLowerCase()) &&
      profiles.filter(other => other.username.toLowerCase() === handle).length === 1;
  }).slice(0, 5) : [];

  const shownEmojis = group === 'all' ? allEmojis : emojiGroups.find(item => item.id === group)?.items ?? allEmojis;

  function insert(text: string, start: number, end: number) {
    const next = value.slice(0, start) + text + value.slice(end);
    if (next.length > limit) return;
    change(next);
    setCaret(start + text.length);
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + text.length, start + text.length); });
  }

  return <div className="sn-social-input">
    <label htmlFor={id}>{label}</label>
    <textarea id={id} className="sn-field" ref={input} value={value} maxLength={limit} rows={rows} placeholder={placeholder}
      autoFocus={autoFocus} disabled={disabled} onChange={event => { change(event.target.value); setCaret(event.target.selectionStart); }}
      onSelect={event => setCaret(event.currentTarget.selectionStart)} />
    <div className="sn-social-tools">
      <button type="button" className="sn-icon" aria-label="Add emoji" aria-expanded={picking} disabled={disabled} onClick={() => setPicking(!picking)}><Smile size={18} /></button>
      <span className="sn-meta">{value.length} / {limit}</span>
    </div>
    {picking && !disabled && <div className="sn-emoji-drawer">
      <div className="sn-emoji-tabs" role="tablist" aria-label="Emoji categories">
        <button type="button" role="tab" aria-selected={group === 'all'} onClick={() => setGroup('all')}>All</button>
        {emojiGroups.map(item => <button type="button" key={item.id} role="tab" aria-selected={group === item.id} onClick={() => setGroup(item.id)}>{item.label}</button>)}
      </div>
      <div className="sn-emoji-picker" role="group" aria-label="Emojis">{shownEmojis.map(emoji =>
        <button type="button" key={emoji} onClick={() => insert(emoji, input.current?.selectionStart ?? value.length, input.current?.selectionEnd ?? value.length)}>{emoji}</button>,
      )}</div>
    </div>}
    {people.length > 0 && active && <div className="sn-mention-list" role="group" aria-label="Suggested profiles">{people.map(person =>
      <button type="button" key={person.id} onClick={() => {
        const end = caret + (/^[a-z0-9_]*/i.exec(value.slice(caret))?.[0].length ?? 0);
        insert('@' + person.username + (value[end] === ' ' ? '' : ' '), caret - active[1].length - 1, end);
      }}><strong>@{person.username}</strong> <span>{person.fullName}</span></button>,
    )}</div>}
  </div>;
}

export function StorySticker({ sticker }: { sticker?: string }) {
  if (!sticker || !Object.hasOwn(travelStickers, sticker)) return null;
  return <span className="sn-story-sticker">{travelStickers[sticker as keyof typeof travelStickers]} {sticker}</span>;
}

export function StickerPicker({ value, change, disabled }: { value?: string; change: (value: string) => void; disabled: boolean }) {
  return <label>Travel sticker<select className="sn-field" value={value ?? ''} disabled={disabled} onChange={event => change(event.target.value)}>
    <option value="">No sticker</option>{Object.entries(travelStickers).map(([label, emoji]) => <option key={label} value={label}>{emoji} {label}</option>)}
  </select></label>;
}
