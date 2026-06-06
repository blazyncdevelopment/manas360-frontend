import type { ReactNode } from 'react';

export type JourneyId =
  | 'home'
  | 'discover'
  | 'group'
  | 'patient'
  | 'provider'
  | 'corporate'
  | 'retreat'
  | 'training'
  | 'admin'
  | 'onboarding'
  | 'executive'
  | 'nri'
  | 'analytics'
  | 'analytics-patient'
  | 'analytics-corporate'
  | 'analytics-chw'
  | 'buddy'
  | 'meera'
  | 'pet'
  | 'sound'
  | 'screening'
  | 'sixer'
  | 'clinic';

export type PhaseVariant = 'blue' | 'green' | 'orange' | 'navy' | 'pink';

export interface StatItem {
  icon: string;
  text: ReactNode;
}

export interface StepItem {
  number?: number;
  title: string;
  description: ReactNode;
  action: string;
}

export interface PricingRow {
  cells: { label: string; value: string }[];
}

export type JourneyBlock =
  | { kind: 'steps'; steps: StepItem[] }
  | { kind: 'phase'; variant: PhaseVariant; title: string; subtitle: string; steps: StepItem[] }
  | { kind: 'pricing'; rows: PricingRow[] };

export interface JourneyContent {
  heading: string;
  description: string;
  stats: StatItem[];
  blocks: JourneyBlock[];
  tipTitle: string;
  tipText: ReactNode;
  next?: { id: JourneyId; label: string };
}

export type HomeCardBadge = 'freebie' | 'feature' | 'analytics';

export interface HomeCard {
  id: JourneyId;
  icon: string;
  title: string;
  description: string;
  cta: string;
  badge?: string;
  badgeType?: HomeCardBadge;
  featureCard?: boolean;
}

export interface HomeSection {
  title: string;
  subtitle: string;
  gridClass: 'freebies-grid' | 'pathways-grid' | 'features-grid';
  cards: HomeCard[];
}
