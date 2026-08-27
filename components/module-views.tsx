'use client'

import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   Beispiel-Layouts (Mockups). Alle Daten sind Platzhalter und ohne Funktion.
--------------------------------------------------------------------------- */

type ViewKind = 'planner' | 'kpi' | 'table' | 'scenario' | 'blank'

const VIEW_BY_MODULE: Record<string, ViewKind> = {
  feinplanungstools: 'planner',
  'automatische-umplanung': 'planner',
  leitstaende: 'planner',
  priorisierungstool: 'planner',
  'oee-dashboard': 'kpi',
  'kpi-werksleitung': 'kpi',
  'drilldowns-auftragsebene': 'table',
  'bedarf-verfuegbarkeit': 'table',
  engpasstool: 'table',
  versandsteuerung: 'table',
  'paletten-verpackung': 'table',
  'szenario-materialverzug': 'scenario',
}

export function ModuleView({ moduleId }: { moduleId: string }) {
  const kind = VIEW_BY_MODULE[moduleId] ?? 'blank'

  if (kind === 'planner') return <PlannerView />
  if (kind === 'kpi') return <KpiView />
  if (kind === 'table') return <TableView />
  if (kind === 'scenario') return <ScenarioView />
  return <BlankView />
}

/* --- gemeinsame Bausteine ------------------------------------------------- */

function Toolbar({ items, action }: { items: string[]; action: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      {items.map((item, i) => (
        <span
          key={item}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs',
            i === 0
              ? 'border-foreground/20 bg-secondary text-foreground'
              : 'border-border text-muted-foreground',
          )}
        >
          {item}
        </span>
      ))}
      <span className="ml-auto rounded-md bg-selected px-3 py-1 text-xs font-medium text-selected-foreground">
        {action}
      </span>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-medium tracking-tight tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

/* --- 1. Feinplanung / Leitstand: Gantt-Board ------------------------------ */

const HOURS = ['06', '08', '10', '12', '14', '16', '18']

type Bar = { left: number; width: number; label: string; tone: 'base' | 'accent' | 'ghost' }

const LINES: { name: string; meta: string; bars: Bar[] }[] = [
  {
    name: 'Linie 1 – Extrusion',
    meta: 'Kap. 92 %',
    bars: [
      { left: 0, width: 26, label: 'A-10428', tone: 'base' },
      { left: 28, width: 10, label: 'Rüst', tone: 'ghost' },
      { left: 40, width: 34, label: 'A-10431', tone: 'base' },
      { left: 76, width: 22, label: 'A-10440', tone: 'accent' },
    ],
  },
  {
    name: 'Linie 2 – Montage',
    meta: 'Kap. 78 %',
    bars: [
      { left: 4, width: 30, label: 'A-10422', tone: 'base' },
      { left: 38, width: 18, label: 'A-10435', tone: 'accent' },
      { left: 60, width: 8, label: 'Rüst', tone: 'ghost' },
      { left: 70, width: 24, label: 'A-10442', tone: 'base' },
    ],
  },
  {
    name: 'Linie 3 – Lackierung',
    meta: 'Kap. 64 %',
    bars: [
      { left: 0, width: 18, label: 'A-10419', tone: 'base' },
      { left: 22, width: 40, label: 'A-10429', tone: 'base' },
      { left: 66, width: 14, label: 'A-10444', tone: 'accent' },
    ],
  },
  {
    name: 'Linie 4 – Prüfstand',
    meta: 'Kap. 51 %',
    bars: [
      { left: 10, width: 22, label: 'A-10425', tone: 'base' },
      { left: 44, width: 12, label: 'Rüst', tone: 'ghost' },
      { left: 58, width: 26, label: 'A-10438', tone: 'base' },
    ],
  },
  {
    name: 'Linie 5 – Verpackung',
    meta: 'Kap. 83 %',
    bars: [
      { left: 6, width: 34, label: 'A-10418', tone: 'base' },
      { left: 44, width: 20, label: 'A-10433', tone: 'accent' },
      { left: 68, width: 28, label: 'A-10446', tone: 'base' },
    ],
  },
]

const POOL = [
  { id: 'A-10451', due: 'Heute 16:00', qty: '1.200 Stk' },
  { id: 'A-10452', due: 'Morgen 08:00', qty: '840 Stk' },
  { id: 'A-10455', due: 'Morgen 14:00', qty: '2.400 Stk' },
  { id: 'A-10459', due: 'KW 34', qty: '600 Stk' },
]

function PlannerView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <section className="overflow-hidden rounded-xl border border-border">
          <Toolbar
            items={['Tagesansicht', 'Woche', 'Ressourcen', 'Filter: Werk 1']}
            action="Auto-Planung"
          />

          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="flex border-b border-border bg-secondary/40">
                <div className="w-44 shrink-0 px-4 py-2 text-xs text-muted-foreground">
                  Ressource
                </div>
                <div className="flex flex-1">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="flex-1 border-l border-border px-2 py-2 text-xs tabular-nums text-muted-foreground"
                    >
                      {h}:00
                    </div>
                  ))}
                </div>
              </div>

              {LINES.map((line) => (
                <div key={line.name} className="flex items-stretch border-b border-border">
                  <div className="flex w-44 shrink-0 flex-col justify-center gap-0.5 px-4 py-3">
                    <span className="text-[13px] leading-tight">{line.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{line.meta}</span>
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-0 flex" aria-hidden="true">
                      {HOURS.map((h) => (
                        <div key={h} className="flex-1 border-l border-border" />
                      ))}
                    </div>
                    <div className="relative h-14">
                      {line.bars.map((bar) => (
                        <div
                          key={bar.label + bar.left}
                          style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                          className={cn(
                            'absolute top-1/2 flex h-8 -translate-y-1/2 items-center overflow-hidden rounded-md px-2 text-xs whitespace-nowrap',
                            bar.tone === 'base' && 'bg-foreground/85 text-background',
                            bar.tone === 'accent' &&
                              'bg-selected text-selected-foreground font-medium',
                            bar.tone === 'ghost' &&
                              'border border-dashed border-border bg-secondary text-muted-foreground',
                          )}
                        >
                          {bar.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-4 rounded-sm bg-foreground/85" aria-hidden="true" />
              Geplant
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-4 rounded-sm bg-selected" aria-hidden="true" />
              Umgeplant
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-4 rounded-sm border border-dashed border-border bg-secondary"
                aria-hidden="true"
              />
              Rüstzeit
            </span>
          </div>
        </section>

        <aside className="rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3 text-sm font-medium">Auftragspool</div>
          <ul className="divide-y divide-border">
            {POOL.map((order) => (
              <li key={order.id} className="flex flex-col gap-1 px-4 py-3">
                <span className="text-[13px] tabular-nums">{order.id}</span>
                <span className="text-xs text-muted-foreground">
                  {order.due} · {order.qty}
                </span>
              </li>
            ))}
          </ul>
          <p className="px-4 py-3 text-xs text-muted-foreground">
            Aufträge per Drag &amp; Drop auf die Linien ziehen.
          </p>
        </aside>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Auslastung" value="87 %" hint="+4 % vs. Vortag" />
        <Metric label="Termintreue" value="96 %" hint="Ziel 95 %" />
        <Metric label="Rüstzeit" value="4,2 h" hint="−0,8 h nach Umplanung" />
      </div>
    </div>
  )
}

/* --- 2. OEE / KPI-Dashboard ---------------------------------------------- */

const OEE_BARS = [
  { label: 'Mo', value: 72 },
  { label: 'Di', value: 81 },
  { label: 'Mi', value: 68 },
  { label: 'Do', value: 88 },
  { label: 'Fr', value: 84 },
  { label: 'Sa', value: 59 },
  { label: 'So', value: 44 },
]

const LOSSES = [
  { label: 'Ungeplante Stillstände', value: '6,4 h', share: 68 },
  { label: 'Rüstverluste', value: '3,1 h', share: 41 },
  { label: 'Geschwindigkeitsverlust', value: '2,2 h', share: 28 },
  { label: 'Qualitätsverlust', value: '0,9 h', share: 12 },
]

function KpiView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="OEE" value="78,4 %" hint="Ziel 80 %" />
        <Metric label="Verfügbarkeit" value="91,2 %" />
        <Metric label="Leistung" value="88,7 %" />
        <Metric label="Qualität" value="97,1 %" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium">OEE-Verlauf</span>
            <span className="text-xs text-muted-foreground">Letzte 7 Tage</span>
          </div>
          <div className="flex h-56 items-stretch gap-3 px-4 py-4">
            {OEE_BARS.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">{bar.value}</span>
                <div className="relative min-h-0 w-full flex-1">
                  <div
                    style={{ height: `${bar.value}%` }}
                    className={cn(
                      'absolute inset-x-0 bottom-0 rounded-t-md',
                      bar.value >= 80 ? 'bg-selected' : 'bg-foreground/20',
                    )}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{bar.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3 text-sm font-medium">
            Verlustanalyse
          </div>
          <ul className="flex flex-col gap-4 px-4 py-4">
            {LOSSES.map((loss) => (
              <li key={loss.label} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[13px] text-pretty">{loss.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{loss.value}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary" aria-hidden="true">
                  <div
                    style={{ width: `${loss.share}%` }}
                    className="h-full rounded-full bg-foreground/70"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

/* --- 3. Tabelle / Drilldown ---------------------------------------------- */

const ROWS = [
  { id: 'A-10428', kunde: 'Meyer GmbH', menge: '1.200', termin: '26.08.', status: 'Im Plan' },
  { id: 'A-10431', kunde: 'Nordtec AG', menge: '840', termin: '26.08.', status: 'Im Plan' },
  { id: 'A-10435', kunde: 'Bauer KG', menge: '2.400', termin: '27.08.', status: 'Kritisch' },
  { id: 'A-10438', kunde: 'Voss Systems', menge: '600', termin: '27.08.', status: 'Im Plan' },
  { id: 'A-10440', kunde: 'Meyer GmbH', menge: '1.850', termin: '28.08.', status: 'Umgeplant' },
  { id: 'A-10442', kunde: 'Heller Werke', menge: '320', termin: '28.08.', status: 'Kritisch' },
  { id: 'A-10446', kunde: 'Nordtec AG', menge: '1.020', termin: '29.08.', status: 'Im Plan' },
]

function TableView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Offene Positionen" value="128" />
        <Metric label="Kritisch" value="9" hint="Eskalation erforderlich" />
        <Metric label="Abdeckung" value="94 %" hint="Materialverfügbarkeit" />
      </div>

      <section className="overflow-hidden rounded-xl border border-border">
        <Toolbar items={['Alle', 'Kritisch', 'Werk 1', 'KW 35']} action="Export" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead className="bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-normal">Auftrag</th>
                <th className="px-4 py-2 font-normal">Kunde</th>
                <th className="px-4 py-2 font-normal">Menge</th>
                <th className="px-4 py-2 font-normal">Termin</th>
                <th className="px-4 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-secondary/50">
                  <td className="px-4 py-3 tabular-nums">{row.id}</td>
                  <td className="px-4 py-3">{row.kunde}</td>
                  <td className="px-4 py-3 tabular-nums">{row.menge}</td>
                  <td className="px-4 py-3 tabular-nums">{row.termin}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          row.status === 'Kritisch' ? 'bg-foreground' : 'bg-selected',
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span>1–7 von 128</span>
          <span className="flex gap-2">
            <span className="rounded-md border border-border px-2 py-1">Zurück</span>
            <span className="rounded-md border border-border px-2 py-1">Weiter</span>
          </span>
        </div>
      </section>
    </div>
  )
}

/* --- 4. Szenario-Vergleich ----------------------------------------------- */

const SCENARIOS = [
  {
    name: 'Szenario A – Termin halten',
    recommended: true,
    rows: [
      ['Termintreue', '96 %'],
      ['Mehrkosten', '4.200 €'],
      ['Betroffene Aufträge', '3'],
      ['Umrüstungen', '+2'],
    ],
  },
  {
    name: 'Szenario B – Kosten minimieren',
    recommended: false,
    rows: [
      ['Termintreue', '88 %'],
      ['Mehrkosten', '900 €'],
      ['Betroffene Aufträge', '11'],
      ['Umrüstungen', '0'],
    ],
  },
]

function ScenarioView() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-sm font-medium">Materialverzug erkannt</span>
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            Rohteil 44-812 · 2 Tage verspätet
          </span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {SCENARIOS.map((s) => (
            <div
              key={s.name}
              className={cn(
                'flex flex-col gap-4 rounded-lg border p-4',
                s.recommended ? 'border-selected' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] text-pretty">{s.name}</span>
                {s.recommended ? (
                  <span className="shrink-0 rounded-md bg-selected px-2 py-1 text-xs font-medium text-selected-foreground">
                    Empfehlung
                  </span>
                ) : null}
              </div>
              <dl className="flex flex-col divide-y divide-border">
                {s.rows.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="text-[13px] text-muted-foreground">{label}</dt>
                    <dd className="text-[13px] tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Simulationen" value="12" hint="in dieser Woche" />
        <Metric label="Reaktionszeit" value="8 min" hint="bis Freigabe" />
        <Metric label="Vermeidbare Kosten" value="18.400 €" />
      </div>
    </div>
  )
}

/* --- 5. Individuelles Tool ------------------------------------------------ */

const SLOTS = [
  'Datenquelle anbinden',
  'Kennzahlen definieren',
  'Ansicht wählen',
  'Rollen und Rechte',
  'Alarmierung',
  'Export und Schnittstellen',
]

function BlankView() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border p-6">
        <h3 className="text-[17px] font-medium">Individuell konfigurierbares Tool</h3>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-pretty text-muted-foreground">
          Beispielhafte Bausteine, aus denen ein maßgeschneidertes Werkzeug für Ihren Prozess
          zusammengesetzt wird.
        </p>
      </section>
      <ul className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SLOTS.map((slot, i) => (
          <li
            key={slot}
            className="flex flex-col justify-between gap-6 rounded-xl border border-dashed border-border p-5"
          >
            <span className="text-xs tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[15px] leading-relaxed text-pretty">{slot}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
