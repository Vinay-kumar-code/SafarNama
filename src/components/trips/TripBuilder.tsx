import React, { useState } from 'react';
import { Clock, Download, MapPin, Pencil, Share2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { isNative, nativeAction } from '../../lib/device';
import { EmptyState, Modal, TravelImage } from '../social/Primitives';
import { useSocial } from '../../context/SocialContext';
import type { TripStop } from '../../types';

export const TripBuilder: React.FC = () => {
  const { currentTrip, removeStopFromTrip, openSpotOnMap, setActiveTab, renameTrip, editTripStop } = useApp();
  const { notify } = useSocial();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [stopDraft, setStopDraft] = useState<{ stop: TripStop; day: string; notes: string } | null>(null);

  // Group stops by day number
  const dayGroups: Record<number, typeof currentTrip.stops> = {};
  currentTrip.stops.forEach(stop => {
    if (!dayGroups[stop.dayNumber]) {
      dayGroups[stop.dayNumber] = [];
    }
    dayGroups[stop.dayNumber].push(stop);
  });

  const availableDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);
  const visibleDay = dayGroups[selectedDay] ? selectedDay : availableDays[0] || 1;
  const currentDayStops = (dayGroups[visibleDay] || []).slice().sort((a, b) => a.orderInDay - b.orderInDay);


  const handleShareTrip = async () => {
    const stops = [...currentTrip.stops].sort((a, b) => a.dayNumber - b.dayNumber || a.orderInDay - b.orderInDay);
    const shareText = [
      currentTrip.title,
      ...stops.flatMap(stop => [
        `Day ${stop.dayNumber}: ${stop.spotName}, ${stop.state}`,
        ...(stop.notes ? [stop.notes] : []),
        `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`,
        '',
      ]),
      `Estimated budget: ${formatINR(currentTrip.totalBudgetInr)}`,
    ].join('\n');
    try {
      if (isNative) await nativeAction({ action: 'share', title: currentTrip.title, text: shareText });
      else if (navigator.share) await navigator.share({ title: currentTrip.title, text: shareText });
      else {
        await navigator.clipboard.writeText(shareText);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Could not share the itinerary.');
    }
  };

  const handleExportOffline = async () => {
    const filename = `SafarNama_${currentTrip.shareSlug}.json`;
    if (isNative) {
      try {
        await nativeAction({ action: 'exportItinerary', filename, itinerary: currentTrip });
        notify('Itinerary saved.');
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'Export canceled') notify('Could not save the itinerary.');
      }
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTrip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify('Itinerary download started.');
  };

  return <section className="sn-secondary-page" aria-labelledby="journey-title">
    <header className="sn-page-heading"><div><h1 id="journey-title">My journeys<span>.</span></h1><p>Keep your stops, plans, and notes in one place.</p></div></header>
    <div className="sn-secondary-grid sn-journey-grid">
      <div className="sn-secondary-stack">
        <section className="sn-panel sn-panel-padding sn-secondary-stack" aria-label="Journey overview">
          <div className="sn-row-heading"><h2>{currentTrip.title}</h2><button className="sn-icon" aria-label="Rename journey" onClick={() => setNameDraft(currentTrip.title)}><Pencil size={17} /></button></div>
          {currentTrip.description && <p className="sn-secondary-body">{currentTrip.description}</p>}
          <dl className="sn-journey-facts">
            <div><dt>Stops</dt><dd>{currentTrip.stops.length}</dd></div>
            <div><dt>Est. budget</dt><dd>{formatINR(currentTrip.totalBudgetInr)}</dd></div>
            <div><dt>Days planned</dt><dd>{availableDays.length}</dd></div>
          </dl>
          <div className="sn-secondary-actions">
            <button className="sn-button" onClick={handleShareTrip}><Share2 size={16} />{copiedLink ? 'Itinerary copied' : 'Share itinerary'}</button>
            <button className="sn-button secondary" onClick={handleExportOffline}><Download size={16} /> Export</button>
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
                  <button className="sn-button secondary" onClick={() => setStopDraft({ stop, day: String(stop.dayNumber), notes: stop.notes || '' })}><Pencil size={15} /> Edit stop</button>
                </div>
              </div>
              <button className="sn-icon" aria-label={`Remove ${stop.spotName} from journey`} onClick={() => removeStopFromTrip(stop.id)}><Trash2 size={17} /></button>
            </li>)}
          </ol>}
      </section>
    </div>

      {nameDraft !== null && <Modal title="Rename journey" onClose={() => setNameDraft(null)}>
        <form className="sn-create-form" onSubmit={async event => { event.preventDefault(); if (await renameTrip(nameDraft)) setNameDraft(null); }}>
          <label>Journey name<input value={nameDraft} onChange={event => setNameDraft(event.target.value)} maxLength={100} required autoFocus /></label>
          <div className="sn-publish-footer"><button className="sn-button" disabled={!nameDraft.trim()}>Save name</button></div>
        </form>
      </Modal>}
      {stopDraft && <Modal title={`Edit ${stopDraft.stop.spotName}`} onClose={() => setStopDraft(null)}>
        <form className="sn-create-form" onSubmit={async event => {
          event.preventDefault();
          if (!await editTripStop(stopDraft.stop.id, Number(stopDraft.day), stopDraft.notes)) return;
          setSelectedDay(Number(stopDraft.day));
          setStopDraft(null);
        }}>
          <label>Day<input type="number" min="1" max="99" required value={stopDraft.day}
            onChange={event => setStopDraft({ ...stopDraft, day: event.target.value })} /></label>
          <label>Notes<textarea value={stopDraft.notes} rows={4} maxLength={1000}
            onChange={event => setStopDraft({ ...stopDraft, notes: event.target.value })} /></label>
          <div className="sn-publish-footer"><button className="sn-button">Save changes</button></div>
        </form>
      </Modal>}
  </section>;
};
