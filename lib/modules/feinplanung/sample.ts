import * as XLSX from 'xlsx'

const SAMPLE_ROWS = [
  {
    Auftragsnummer: 'FA-1042',
    Kunde: 'Müller GmbH',
    Artikel: 'Gehäuse A-12',
    Menge: 80,
    Liefertermin: '25.08.2026',
    Dringlichkeit: 'Eil',
    Arbeitsplatz: 'WP-12',
  },
  {
    Auftragsnummer: 'FA-1038',
    Kunde: 'Nordwerk AG',
    Artikel: 'Welle 40x200',
    Menge: 240,
    Liefertermin: '27.08.2026',
    Dringlichkeit: 'Kritisch',
    Arbeitsplatz: 'WP-04',
  },
  {
    Auftragsnummer: 'FA-1051',
    Kunde: 'Helios Medical',
    Artikel: 'Deckel B',
    Menge: 40,
    Liefertermin: '28.08.2026',
    Dringlichkeit: 'Normal',
    Arbeitsplatz: 'WP-12',
  },
  {
    Auftragsnummer: 'FA-1020',
    Kunde: 'Kron & Sohn',
    Artikel: 'Flansch 80',
    Menge: 16,
    Liefertermin: '02.09.2026',
    Dringlichkeit: 'Hoch',
    Arbeitsplatz: 'WP-07',
  },
  {
    Auftragsnummer: 'FA-1066',
    Kunde: 'Apex Tools',
    Artikel: 'Adapterplatte',
    Menge: 120,
    Liefertermin: '10.09.2026',
    Dringlichkeit: 'Normal',
    Arbeitsplatz: 'WP-03',
  },
  {
    Auftragsnummer: 'FA-1011',
    Kunde: 'Müller GmbH',
    Artikel: 'Gehäuse A-08',
    Menge: 12,
    Liefertermin: '22.09.2026',
    Dringlichkeit: 'Niedrig',
    Arbeitsplatz: 'WP-12',
  },
  {
    Auftragsnummer: 'FA-1074',
    Kunde: 'Seeberg Logistics',
    Artikel: 'Trägerprofil',
    Menge: 300,
    Liefertermin: '30.08.2026',
    Dringlichkeit: 'Eil',
    Arbeitsplatz: 'WP-09',
  },
  {
    Auftragsnummer: 'FA-1004',
    Kunde: 'Helios Medical',
    Artikel: 'Dichtungssatz',
    Menge: 500,
    Liefertermin: '15.10.2026',
    Dringlichkeit: 'Normal',
    Arbeitsplatz: 'WP-01',
  },
]

export function buildSampleWorkbook(): { filename: string; buffer: Buffer } {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Feinplanung')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return { filename: 'feinplanung-beispiel.xlsx', buffer }
}
