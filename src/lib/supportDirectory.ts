/**
 * Support service directory (UK)
 *
 * Bundled copy of the verified directory in PRD section 12.3 (verified 28 September 2026).
 * Cards render from this data; the AI never writes support links itself.
 * Opening hours are evaluated in the device's local time zone.
 */

export type SupportServiceId =
  | 'uk-emergency'
  | 'uk-childline'
  | 'uk-ceop'
  | 'uk-nspcc'
  | 'uk-samaritans'
  | 'uk-ndah'
  | 'uk-stalking'
  | 'uk-rapecrisis'
  | 'uk-safeline';

/** 0 = Sunday … 6 = Saturday; times are minutes after midnight. */
interface OpeningWindow {
  days: number[];
  open: number;
  close: number;
}

export interface SupportService {
  serviceId: SupportServiceId;
  name: string;
  description: string;
  phone: string | null;
  webUrl: string | null;
  reportUrl: string | null;
  /** null = open 24/7, or no phone line (online form) */
  hours: OpeningWindow[] | null;
  /** Shown instead of computed hours when the provider's hours are not fixed. */
  hoursNote?: string;
  eligibilityText: string;
  minAge: number | null;
  maxAge: number | null;
  isEmergency: boolean;
}

export const SUPPORT_DIRECTORY_VERSION = 1;
export const SUPPORT_DIRECTORY_VERIFIED_AT = '2026-09-28';

const WEEKDAYS = [1, 2, 3, 4, 5];
const h = (hours: number, minutes = 0) => hours * 60 + minutes;

export const SUPPORT_SERVICES: Record<SupportServiceId, SupportService> = {
  'uk-emergency': {
    serviceId: 'uk-emergency',
    name: 'Emergency services',
    description: 'Police, ambulance or fire service when someone is in immediate danger.',
    phone: '999',
    webUrl: null,
    reportUrl: null,
    hours: null,
    eligibilityText: 'Anyone in the UK in immediate danger',
    minAge: null,
    maxAge: null,
    isEmergency: true,
  },
  'uk-childline': {
    serviceId: 'uk-childline',
    name: 'Childline',
    description: 'Free, confidential support for children and young people, about anything.',
    phone: '0800 1111',
    webUrl: 'https://www.childline.org.uk',
    reportUrl: null,
    hours: null,
    eligibilityText: 'For children and young people in the UK',
    minAge: null,
    maxAge: 18,
    isEmergency: false,
  },
  'uk-ceop': {
    serviceId: 'uk-ceop',
    name: 'CEOP Safety Centre',
    description: 'Report online sexual abuse or grooming of someone under 18.',
    phone: null,
    webUrl: 'https://www.ceop.police.uk/Safety-Centre',
    reportUrl: 'https://www.ceop.police.uk/ceop-reporting',
    hours: null,
    eligibilityText: 'Under 18s; not for bullying, fake accounts or hacking',
    minAge: null,
    maxAge: 17,
    isEmergency: false,
  },
  'uk-nspcc': {
    serviceId: 'uk-nspcc',
    name: 'NSPCC Helpline',
    description: 'Advice and support for adults who are worried about a child.',
    phone: '0808 800 5000',
    webUrl: 'https://www.nspcc.org.uk',
    reportUrl: null,
    hours: [{ days: WEEKDAYS, open: h(10), close: h(16) }],
    eligibilityText: 'Adults worried about a child',
    minAge: 18,
    maxAge: null,
    isEmergency: false,
  },
  'uk-samaritans': {
    serviceId: 'uk-samaritans',
    name: 'Samaritans',
    description: 'Someone to talk to, whatever you are going through.',
    phone: '116 123',
    webUrl: 'https://www.samaritans.org',
    reportUrl: null,
    hours: null,
    eligibilityText: 'Anyone in the UK',
    minAge: null,
    maxAge: null,
    isEmergency: false,
  },
  'uk-ndah': {
    serviceId: 'uk-ndah',
    name: 'National Domestic Abuse Helpline',
    description: 'Free, confidential support for anyone experiencing domestic abuse.',
    phone: '0808 2000 247',
    webUrl: 'https://www.nationaldahelpline.org.uk',
    reportUrl: null,
    hours: null,
    eligibilityText: 'People experiencing domestic abuse in England',
    minAge: 16,
    maxAge: null,
    isEmergency: false,
  },
  'uk-stalking': {
    serviceId: 'uk-stalking',
    name: 'National Stalking Helpline',
    description: 'Advice for anyone affected by stalking or harassment.',
    phone: '0808 802 0300',
    webUrl: 'https://www.suzylamplugh.org',
    reportUrl: null,
    hours: [
      { days: [1, 3], open: h(9, 30), close: h(20) },
      { days: [2, 4, 5], open: h(9, 30), close: h(16) },
    ],
    eligibilityText: 'UK residents affected by stalking',
    minAge: null,
    maxAge: null,
    isEmergency: false,
  },
  'uk-rapecrisis': {
    serviceId: 'uk-rapecrisis',
    name: 'Rape Crisis 24/7 Support Line',
    description: 'Free, confidential support for anyone affected by sexual violence or abuse.',
    phone: '0808 500 2222',
    webUrl: 'https://247sexualabusesupport.org.uk',
    reportUrl: null,
    hours: null,
    eligibilityText: 'Aged 16 and over, England and Wales',
    minAge: 16,
    maxAge: null,
    isEmergency: false,
  },
  'uk-safeline': {
    serviceId: 'uk-safeline',
    name: 'Safeline male survivor line',
    description: 'Support for people who identify as male affected by rape or sexual abuse.',
    phone: '0808 800 5005',
    webUrl: 'https://www.safeline.org.uk',
    reportUrl: null,
    hours: null,
    hoursNote: 'Check opening hours on their website',
    eligibilityText: 'England and Wales',
    minAge: null,
    maxAge: null,
    isEmergency: false,
  },
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return mins === 0 ? `${hours12}${suffix}` : `${hours12}:${String(mins).padStart(2, '0')}${suffix}`;
}

/** "Open 24/7", "Open now until 4pm" or "Opens Monday 10am". */
export function availabilityText(service: SupportService, now: Date = new Date()): string {
  if (service.hoursNote) return service.hoursNote;
  if (!service.hours) return service.phone ? 'Open 24/7' : 'Online, any time';

  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = service.hours.find((w) => w.days.includes(day));
  if (today && minutes >= today.open && minutes < today.close) {
    return `Open now until ${formatTime(today.close)}`;
  }

  for (let offset = 0; offset < 8; offset++) {
    const candidateDay = (day + offset) % 7;
    const window = service.hours.find((w) => w.days.includes(candidateDay));
    if (!window) continue;
    if (offset === 0 && minutes >= window.open) continue;
    const when = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : DAY_NAMES[candidateDay];
    return `Closed now · Opens ${when} ${formatTime(window.open)}`;
  }
  return 'Check opening hours on their website';
}

export function isUnder18Band(ageBand: string | null | undefined): boolean {
  return ageBand === 'under-13' || ageBand === '13-15' || ageBand === '16-17' || ageBand === 'prefer-not-to-say' || !ageBand;
}

/** The general listening service for an age band (PRD 12.2, "General concern"). */
export function generalSupportFor(ageBand: string | null | undefined, isParentCarer = false): SupportService {
  if (isParentCarer && !isUnder18Band(ageBand)) return SUPPORT_SERVICES['uk-nspcc'];
  return isUnder18Band(ageBand) ? SUPPORT_SERVICES['uk-childline'] : SUPPORT_SERVICES['uk-samaritans'];
}
