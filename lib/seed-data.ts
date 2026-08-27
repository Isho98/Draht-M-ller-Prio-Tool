import type { Area, Company } from '@/lib/types'

export const COMPANY: Company = {
  name: 'adept&',
  claim: 'Beratung. Software. Integration.',
}

export const SEED_AREAS: Area[] = [
  {
    id: 'produktion',
    label: 'Produktion und Feinplanung',
    functions: [
      { id: 'feinplanungstools', label: 'Feinplanungstools' },
      { id: 'automatische-umplanung', label: 'Automatische Umplanung' },
      { id: 'oee-dashboard', label: 'OEE-Dashboard' },
      { id: 'leitstaende', label: 'Leitstände' },
      { id: 'kpi-werksleitung', label: 'KPI-Ansicht Werksleitung' },
      { id: 'produktion-individuell', label: 'Individuelles Tool' },
    ],
  },
  {
    id: 'logistik',
    label: 'Logistik und Versand',
    functions: [
      { id: 'paletten-verpackung', label: 'Paletten und Verpackungslogik' },
      { id: 'versandsteuerung', label: 'Versandsteuerung' },
      { id: 'priorisierungstool', label: 'Priorisierungstool' },
      { id: 'logistik-individuell', label: 'Individuelles Tool' },
    ],
  },
  {
    id: 'supplychain',
    label: 'Supplychain und Materialsteuerung',
    functions: [
      { id: 'bedarf-verfuegbarkeit', label: 'Bedarfs und Verfügbarkeitsübersicht' },
      { id: 'szenario-materialverzug', label: 'Szenario-Logik bei Materialverzug' },
      { id: 'engpasstool', label: 'Engpasstool' },
      { id: 'supplychain-individuell', label: 'Individuelles Tool' },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    functions: [
      { id: 'drilldowns-auftragsebene', label: 'Drilldowns Auftragsebene' },
      { id: 'reporting-individuell', label: 'Individuelles Tool' },
    ],
  },
]
