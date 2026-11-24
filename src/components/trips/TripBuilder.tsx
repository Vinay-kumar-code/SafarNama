import { useState } from 'react';
import { ArrowDown, ArrowUp, Clock, Download, MapPin, Pencil, Plus, Share2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { isNative, nativeAction } from '../../lib/device';
import { EmptyState, Modal, TravelImage } from '../social/Primitives';
import { useSocial } from '../../context/SocialContext';
import type { Trip, TripStop } from '../../types';

export function TripBuilder() {
  const { journeys, setActiveTab } = useApp();
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  function openCreate() {
    if (journeys.requireAccount()) setNameDraft('');
  }

  return <section className="sn-secondary-page" aria-labelledby="journey-title">
    <header className="sn-page-heading sn-journey-heading">
      <div><h1 id="journey-title">My journeys<span>.</span></h1><p>Plan your stops, time, and budget for each trip.</p></div>
      <button className="sn-button" disabled={!journeys.ready || journeys.saving || journeys.trips.length >= 20} onClick={openCreate}><Plus size={17} /> New journey</button>
    </header>
    {journeys.current ? <>
      {journeys.trips.length > 1 && <label className="sn-secondary-label sn-journey-select">Choose journey
        <select className="sn-field" value={journeys.current.id} disabled={journeys.saving} onChange={event => journeys.selectTrip(event.target.value)}>
          {journeys.trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
        </select>
      </label>}
      <JourneyPlan key={journeys.current.id} trip={journeys.current} />
    </> : journeys.ready ? <EmptyState title="No journeys yet" description="Create a journey here or add a stop from a place guide or travel story."
      action={<button className="sn-button secondary" onClick={() => setActiveTab('explore')}>Explore places</button>} />
      : <p role="status" className="sn-secondary-body">Loading your journeys…</p>}
    {nameDraft !== null && <Modal title="New journey" onClose={() => { if (!journeys.saving) setNameDraft(null); }}>
      <form className="sn-secondary-form" onSubmit={async event => {
        event.preventDefault();
        if (await journeys.createTrip(nameDraft)) setNameDraft(null);
      }}>
        <label className="sn-secondary-label">Journey name<input className="sn-field" value={nameDraft} onChange={event => setNameDraft(event.target.value)} maxLength={100} required autoFocus /></label>
        <div className="sn-secondary-actions"><button className="sn-button" disabled={!nameDraft.trim() || journeys.saving}>Create journey</button></div>
      </form>
    </Modal>}
  </section>;
}

function JourneyPlan({ trip }: { trip: Trip }) {
  const { journeys, openSpotOnMap, setActiveTab } = useApp();
  const { notify } = useSocial();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [stopDraft, setStopDraft] = useState<TripStop | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const availableDays = [...new Set(trip.stops.map(stop => stop.dayNumber))].sort((a, b) => a - b);
  const visibleDay = availableDays.includes(selectedDay) ? selectedDay : availableDays[0] ?? 1;
  const currentDayStops = trip.stops.filter(stop => stop.dayNumber === visibleDay).sort((a, b) => a.orderInDay - b.orderInDay);

  const handleShareTrip = async () => {
    const stops = [...trip.stops].sort((a, b) => a.dayNumber - b.dayNumber || a.orderInDay - b.orderInDay);
    const shareText = [
      trip.title,
      ...stops.flatMap(stop => [
        `Day ${stop.dayNumber}: ${stop.spotName}, ${stop.state}`,
        ...(stop.notes ? [stop.notes] : []),
        `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`,
        '',
      ]),
      `Estimated budget: ${formatINR(trip.totalBudgetInr)}`,
    ].join('\n');
    try {
      if (isNative) await nativeAction({ action: 'share', title: trip.title, text: shareText });
      else if (navigator.share) await navigator.share({ title: trip.title, text: shareText });
      else {
        await navigator.clipboard.writeText(shareText);
        notify('Itinerary copied.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Could not share the itinerary.');
    }
  };

  const handleExportOffline = async () => {
    const filename = `SafarNama_${trip.shareSlug}.json`;
    if (isNative) {
      try {
        await nativeAction({ action: 'exportItinerary', filename, itinerary: trip });
        notify('Itinerary saved.');
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'Export canceled') notify('Could not save the itinerary.');
      }
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify('Itinerary download started.');
  };

  return <>
    <div className="sn-secondary-grid sn-journey-grid">
      <div className="sn-secondary-stack">
        <section className="sn-panel sn-panel-padding sn-secondary-stack" aria-label="Journey overview">
          <div className="sn-row-heading"><h2>{trip.title}</h2><button className="sn-icon" aria-label="Rename journey" onClick={() => setNameDraft(trip.title)}><Pencil size={17} /></button></div>
          {trip.description && <p className="sn-secondary-body">{trip.description}</p>}
          <dl className="sn-journey-facts">
            <div><dt>Stops</dt><dd>{trip.stops.length}</dd></div>
            <div><dt>Est. budget</dt><dd>{formatINR(trip.totalBudgetInr)}</dd></div>
            <div><dt>Days planned</dt><dd>{availableDays.length}</dd></div>
          </dl>
          <div className="sn-secondary-actions">
            <button className="sn-button" onClick={handleShareTrip}><Share2 size={16} /> Share itinerary</button>
            <button className="sn-button secondary" onClick={handleExportOffline}><Download size={16} /> Export</button>
            <button className="sn-icon" aria-label="Delete journey" onClick={() => setConfirmDelete(true)}><Trash2 size={17} /></button>
          </div>
        </section>
      </div>
      <section className="sn-secondary-stack sn-journey-route" aria-label="Daily itinerary">
        <div className="sn-row-heading"><h2>Itinerary</h2>{currentDayStops.length > 0 && <span className="sn-meta">{currentDayStops.length} {currentDayStops.length === 1 ? 'stop' : 'stops'} on day {visibleDay}</span>}</div>
        {availableDays.length > 0 && <div className="sn-segment" role="group" aria-label="Itinerary days">
          {availableDays.map(day => <button key={day} aria-pressed={visibleDay === day} onClick={() => setSelectedDay(day)}>Day {day}</button>)}
        </div>}
        {currentDayStops.length === 0 ? <EmptyState title="No stops yet" description="Open a place guide or travel story to start building your itinerary." action={<button className="sn-button secondary" onClick={() => setActiveTab('explore')}>Explore places</button>} />
          : <ol className="sn-panel">
            {currentDayStops.map((stop, index) => <li key={stop.id} className="sn-list-row sn-journey-stop">
              <span className="sn-soft-icon">{index + 1}</span>
              {stop.thumbnailUrl && <TravelImage src={stop.thumbnailUrl} alt="" className="sn-journey-thumbnail" />}
              <div className="sn-list-text">
                <h3>{stop.spotName}</h3>
                <p className="sn-secondary-body">{stop.state}</p>
                <p className="sn-secondary-actions"><span className="sn-meta"><Clock size={14} /> About {stop.stayMinutes} min</span>{stop.costInInr !== undefined && <span className="sn-meta">{formatINR(stop.costInInr)}</span>}</p>
                {stop.notes && <p className="sn-secondary-body sn-journey-notes">{stop.notes}</p>}
                <div className="sn-secondary-actions sn-journey-stop-actions">
                  <button className="sn-button secondary" onClick={() => openSpotOnMap(stop.latitude, stop.longitude, stop.spotName)}><MapPin size={15} /> View on map</button>
                  <button className="sn-button secondary" onClick={() => setStopDraft(stop)}><Pencil size={15} /> Edit stop</button>
                  {currentDayStops.length > 1 && <div className="sn-journey-order" role="group" aria-label={`Reorder ${stop.spotName}`}>
                    <button className="sn-icon" aria-label={`Move ${stop.spotName} up`} disabled={journeys.saving || index === 0}
                      onClick={() => void journeys.moveStop(trip.id, stop.id, visibleDay, -1)}><ArrowUp size={17} /></button>
                    <button className="sn-icon" aria-label={`Move ${stop.spotName} down`} disabled={journeys.saving || index === currentDayStops.length - 1}
                      onClick={() => void journeys.moveStop(trip.id, stop.id, visibleDay, 1)}><ArrowDown size={17} /></button>
                  </div>}
                </div>
              </div>
              <button className="sn-icon" aria-label={`Remove ${stop.spotName} from journey`} disabled={journeys.saving}
                onClick={() => void journeys.removeStop(trip.id, stop.id)}><Trash2 size={17} /></button>
            </li>)}
          </ol>}
      </section>
    </div>

    {nameDraft !== null && <Modal title="Rename journey" onClose={() => { if (!journeys.saving) setNameDraft(null); }}>
      <form className="sn-secondary-form" onSubmit={async event => {
        event.preventDefault();
        if (await journeys.renameTrip(trip.id, nameDraft)) setNameDraft(null);
      }}>
        <label className="sn-secondary-label">Journey name<input className="sn-field" value={nameDraft} onChange={event => setNameDraft(event.target.value)} maxLength={100} required autoFocus /></label>
        <div className="sn-secondary-actions"><button className="sn-button" disabled={!nameDraft.trim() || journeys.saving}>Save name</button></div>
      </form>
    </Modal>}
    {stopDraft && <Modal title={`Edit ${stopDraft.spotName}`} onClose={() => { if (!journeys.saving) setStopDraft(null); }}>
      <form className="sn-secondary-form" onSubmit={async event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const dayNumber = Number(data.get('day'));
        const saved = await journeys.editStop(trip.id, stopDraft.id, { dayNumber, notes: String(data.get('notes')),
          stayMinutes: Number(data.get('minutes')), costInInr: Number(data.get('cost')) });
        if (saved) { setSelectedDay(dayNumber); setStopDraft(null); }
      }}>
        <label className="sn-secondary-label">Day<input className="sn-field" name="day" type="number" min={1} max={99} required defaultValue={stopDraft.dayNumber} /></label>
        <div className="sn-journey-edit-fields">
          <label className="sn-secondary-label">Time (minutes)<input className="sn-field" name="minutes" type="number" min={0} max={1440} required defaultValue={stopDraft.stayMinutes} /></label>
          <label className="sn-secondary-label">Estimated cost (₹)<input className="sn-field" name="cost" type="number" min={0} max={1000000} step="0.01" defaultValue={stopDraft.costInInr} /></label>
        </div>
        <label className="sn-secondary-label">Notes<textarea className="sn-field" name="notes" defaultValue={stopDraft.notes} rows={3} maxLength={1000} /></label>
        <div className="sn-secondary-actions"><button className="sn-button" disabled={journeys.saving}>Save changes</button></div>
      </form>
    </Modal>}
    {confirmDelete && <Modal title="Delete journey?" onClose={() => { if (!journeys.saving) setConfirmDelete(false); }}>
      <div className="sn-secondary-form">
        <p className="sn-secondary-body">Delete {trip.title} and all of its planned stops?</p>
        <div className="sn-secondary-actions">
          <button className="sn-button secondary" disabled={journeys.saving} onClick={() => setConfirmDelete(false)}>Cancel</button>
          <button className="sn-button" disabled={journeys.saving} onClick={async () => {
            if (await journeys.deleteTrip(trip.id)) notify('Journey deleted.');
          }}>Delete journey</button>
        </div>
      </div>
    </Modal>}
  </>;
}
