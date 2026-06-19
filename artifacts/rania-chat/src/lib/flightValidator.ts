export type FlightCardRaw = {
  id?: number | string;
  airline?: string;
  airlineCode?: string;
  flightNum?: string;
  from?: string;
  to?: string;
  depart?: string; // ISO or date string
  arrive?: string;
  price?: number | null;
  currency?: string;
  source?: string;
};

export function normalizeDate(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  // return YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export function validateFlights(flights: FlightCardRaw[], fromIata: string, toIata: string, reqDate: string) {
  const requested = reqDate && reqDate.length === 10 ? reqDate : normalizeDate(reqDate);
  const validFlights: FlightCardRaw[] = [];
  const issues: Array<{ idx: number; reason: string }> = [];
  flights = flights || [];
  flights.forEach((f, i) => {
    const fFrom = (f.from || "").toUpperCase();
    const fTo = (f.to || "").toUpperCase();
    const fDate = normalizeDate(f.depart || f.arrive || "") || null;
    if (!f.price && f.price !== 0) {
      issues.push({ idx: i, reason: 'missing_price' });
      return;
    }
    if (fromIata && fFrom && fromIata.toUpperCase() !== fFrom) { issues.push({ idx: i, reason: 'origin_mismatch' }); return; }
    if (toIata && fTo && toIata.toUpperCase() !== fTo) { issues.push({ idx: i, reason: 'dest_mismatch' }); return; }
    if (requested && fDate && requested !== fDate) { issues.push({ idx: i, reason: `date_mismatch (card:${fDate} <> req:${requested})` }); return; }
    // airline code and currency presence
    if (!f.airline && !f.airlineCode) { issues.push({ idx: i, reason: 'missing_airline' }); return; }
    if (!f.currency) { issues.push({ idx: i, reason: 'missing_currency' }); return; }
    validFlights.push(f);
  });
  return { validFlights, issues };
}
