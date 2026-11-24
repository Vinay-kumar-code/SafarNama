import { useRef, useState } from 'react';
import { hasServerStorage } from '../lib/serverStorage';
import { getStoredData, setStoredData } from '../lib/utils';
import type { Trip, TripStop } from '../types';
import { useAuth } from './AuthContext';
import { reportStorageError, useServerData, type JourneyRecord } from './ServerDataContext';

export type JourneyStopInput = Pick<TripStop, 'postId' | 'spotName' | 'state' | 'latitude' | 'longitude' | 'costInInr' | 'thumbnailUrl' | 'notes'>;

export function samePlace(a: JourneyStopInput, b: JourneyStopInput) {
  return a.spotName === b.spotName && a.state === b.state;
}

function appendStop(trip: Trip, stop: JourneyStopInput, dayNumber: number): Trip {
  if (trip.stops.some(existing => samePlace(existing, stop))) throw new Error('This place is already in this journey.');
  if (trip.stops.length >= 250) throw new Error('A journey can contain up to 250 stops.');
  const orderInDay = nextOrder(trip, dayNumber);
  return { ...trip, stops: [...trip.stops, { ...stop, id: crypto.randomUUID(), tripId: trip.id, dayNumber, orderInDay, stayMinutes: 90 }] };
}

export function useJourneys() {
  const { profile, openAuthModal } = useAuth();
  const { snapshot, write } = useServerData();
  const owner = profile?.id || 'guest';
  const key = `journeys_v1_${owner}`;
  const selectionKey = `selected_journey_${owner}`;
  const [localTrips, setLocalTrips] = useState<Trip[]>(() => {
    if (hasServerStorage) return [];
    const saved = getStoredData<Trip[] | null>(key, null);
    if (saved) return saved;
    const legacy = getStoredData<Trip | null>(`trip_v2_${owner}`, null);
    return legacy ? [legacy] : [];
  });
  const [selectedId, setSelectedId] = useState(() => getStoredData(selectionKey, ''));
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const account = snapshot?.account;
  const records: JourneyRecord[] = account?.trips ?? (account?.trip ? [{ recordId: 'current', version: account.tripVersion, trip: account.trip }] : []);
  const trips = hasServerStorage ? records.map(record => record.trip) : localTrips;
  const current = trips.find(trip => trip.id === selectedId) ?? trips[0];
  const ready = !hasServerStorage || !profile || Boolean(snapshot);

  function selectTrip(id: string) {
    setSelectedId(id);
    setStoredData(selectionKey, id);
  }

  function requireAccount() {
    if (!hasServerStorage || profile) return true;
    openAuthModal();
    return false;
  }

  async function mutate(id: string, update: (trip: Trip | undefined) => Trip | undefined) {
    if (!requireAccount() || pending.current) return false;
    if (!ready) {
      reportStorageError(new Error('Your journeys are still loading. Try again.'));
      return false;
    }
    pending.current = true;
    setSaving(true);
    try {
      const existing = trips.find(trip => trip.id === id);
      const next = update(existing);
      if (next) {
        const orderByDay = new Map<number, number>();
        next.stops = [...next.stops].sort((a, b) => a.dayNumber - b.dayNumber || a.orderInDay - b.orderInDay).map(stop => {
          const orderInDay = (orderByDay.get(stop.dayNumber) ?? 0) + 1;
          orderByDay.set(stop.dayNumber, orderInDay);
          return { ...stop, orderInDay };
        });
        next.totalBudgetInr = next.stops.reduce((sum, stop) => sum + (stop.costInInr ?? 0), 0);
      }
      if (hasServerStorage) {
        const record = records.find(item => item.trip.id === id);
        await write('me', 'trip', record?.recordId ?? id, next
          ? { version: record?.version ?? 0, trip: next }
          : { version: record?.version, remove: true });
      } else {
        let updated: Trip[];
        if (!next) updated = localTrips.filter(trip => trip.id !== id);
        else if (existing) updated = localTrips.map(trip => trip.id === id ? next : trip);
        else updated = [next, ...localTrips];
        localStorage.setItem(`safarnama_${key}`, JSON.stringify(updated));
        setLocalTrips(updated);
      }
      return true;
    } catch (error) {
      reportStorageError(error);
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  function changeTrip(id: string, update: (trip: Trip) => Trip | undefined) {
    return mutate(id, trip => {
      if (!trip) throw new Error('This journey is no longer available.');
      return update(trip);
    });
  }

  async function createTrip(title: string, stop?: JourneyStopInput, day = 1) {
    if (!title.trim() || !validDay(day)) return false;
    const id = crypto.randomUUID();
    const created = await mutate(id, () => {
      if (trips.length >= 20) throw new Error('You can keep up to 20 journeys.');
      const trip: Trip = { id, title: title.trim().slice(0, 100), description: '', totalBudgetInr: 0,
        isPublic: false, shareSlug: crypto.randomUUID(), stops: [], createdAt: new Date().toISOString() };
      return stop ? appendStop(trip, stop, day) : trip;
    });
    if (created) selectTrip(id);
    return created;
  }

  function addStop(id: string, stop: JourneyStopInput, day: number) {
    return validDay(day) ? changeTrip(id, trip => appendStop(trip, stop, day)) : Promise.resolve(false);
  }

  function editStop(id: string, stopId: string, details: Pick<TripStop, 'dayNumber' | 'notes' | 'stayMinutes' | 'costInInr'>) {
    const { dayNumber, notes, stayMinutes, costInInr = 0 } = details;
    if (!validDay(dayNumber) || !Number.isInteger(stayMinutes) || stayMinutes < 0 || stayMinutes > 1440 ||
      !Number.isFinite(costInInr) || costInInr < 0 || costInInr > 1_000_000) return Promise.resolve(false);
    return changeTrip(id, trip => ({ ...trip, stops: trip.stops.map(stop => stop.id !== stopId ? stop : {
      ...stop, dayNumber, stayMinutes, costInInr, notes: notes?.trim().slice(0, 1000),
      orderInDay: stop.dayNumber === dayNumber ? stop.orderInDay : nextOrder(trip, dayNumber),
    }) }));
  }

  function moveStop(id: string, stopId: string, day: number, offset: -1 | 1) {
    return changeTrip(id, trip => {
      const stops = trip.stops.filter(stop => stop.dayNumber === day).sort((a, b) => a.orderInDay - b.orderInDay);
      const index = stops.findIndex(stop => stop.id === stopId);
      const target = stops[index + offset];
      if (index < 0 || !target) throw new Error('This stop cannot move in that direction.');
      return { ...trip, stops: trip.stops.map(stop => {
        if (stop.id === stopId) return { ...stop, orderInDay: target.orderInDay };
        if (stop.id === target.id) return { ...stop, orderInDay: stops[index].orderInDay };
        return stop;
      }) };
    });
  }

  return { trips, current, ready, saving, selectTrip, requireAccount, createTrip, addStop, editStop, moveStop,
    renameTrip: (id: string, title: string) => title.trim()
      ? changeTrip(id, trip => ({ ...trip, title: title.trim().slice(0, 100) })) : Promise.resolve(false),
    deleteTrip: (id: string) => changeTrip(id, () => undefined),
    removeStop: (id: string, stopId: string) => changeTrip(id, trip => ({ ...trip, stops: trip.stops.filter(stop => stop.id !== stopId) })),
  };
}

function validDay(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= 99;
}

function nextOrder(trip: Trip, dayNumber: number) {
  return 1 + Math.max(0, ...trip.stops.filter(stop => stop.dayNumber === dayNumber).map(stop => stop.orderInDay));
}
