// ============================================================================
// INVESTOR TYPES
// DawinOS v2.0 - Capital Hub Module
// Type definitions for Investor CRM
// ============================================================================

import { Timestamp } from 'firebase/firestore';
import {
  InvestorType,
  InvestmentStage,
  InvestmentSector,
  RelationshipStatus,
  CommunicationType,
  MeetingType,
  RelationshipHealthLevel,
  ContactRole,
  InvestorSource,
} from '../constants/investor.constants';

// ----------------------------------------------------------------------------
// INVESTOR ENTITY
// ----------------------------------------------------------------------------

export interface Investor {
  id: string;
  companyId: string;
  
  // Basic info
  name: string;
  type: InvestorType;
  description?: string;
  website?: string;
  linkedIn?: string;
  
  // Organization details (for institutional investors)
  organizationName?: string;
  aum?: number;
  fundSize?: number;
  fundVintage?: number;
  
  // Location
  headquarters: string;
  operatingRegions: string[];
  hasUgandaPresence: boolean;
  localOffice?: string;
  
  // Investment criteria
  investmentCriteria: InvestmentCriteria;
  
  // Contacts
  primaryContactId?: string;
  contacts: InvestorContact[];
  
  // Relationship
  relationshipStatus: RelationshipStatus;
  relationshipOwnerId: string;
  relationshipOwnerName: string;
  relationshipHealth: RelationshipHealthLevel;
  healthScore: number;
  
  // Engagement metrics
  lastContactDate?: Timestamp;
  nextFollowUpDate?: Timestamp;
  totalInteractions: number;
  totalMeetings: number;
  totalDeals: number;
  activeDeals: number;
  
  // Source
  source: InvestorSource;
  referredBy?: string;
  
  // Tags and notes
  tags: string[];
  notes?: string;
  
  // Metadata
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvestmentCriteria {
  stages: InvestmentStage[];
  sectors: InvestmentSector[];
  geographies: string[];
  checkSizeMin: number;
  checkSizeMax: number;
  ownershipPreference?: 'minority' | 'majority' | 'control' | 'flexible';
  instrumentTypes: ('equity' | 'debt' | 'convertible' | 'mezzanine' | 'grant')[];
  impactFocus?: boolean;
  impactThemes?: string[];
  coInvestPreference?: boolean;
  leadPreference?: 'lead' | 'follow' | 'either';
  investmentHorizon?: number;
  exclusions?: string[];
}

// ----------------------------------------------------------------------------
// INVESTOR CONTACT
// ----------------------------------------------------------------------------

export interface InvestorContact {
  id: string;
  investorId: string;
  
  // Personal info
  firstName: string;
  lastName: string;
  title: string;
  role: ContactRole;
  
  // Contact details
  email: string;
  phone?: string;
  mobile?: string;
  whatsApp?: string;
  linkedIn?: string;
  
  // Preferences
  preferredContactMethod: CommunicationType;
  timezone?: string;
  
  // Relationship
  isPrimary: boolean;
  isDecisionMaker: boolean;
  influence: 'high' | 'medium' | 'low';
  
  // Engagement
  lastContactDate?: Timestamp;
  totalInteractions: number;
  notes?: string;
  
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// COMMUNICATION
// ----------------------------------------------------------------------------

export interface Communication {
  id: string;
  companyId: string;
  investorId: string;
  investorName: string;
  contactId?: string;
  contactName?: string;
  
  // Communication details
  type: CommunicationType;
  direction: 'inbound' | 'outbound';
  subject: string;
  summary: string;
  
  // Related entities
  dealId?: string;
  dealName?: string;
  
  // Timing
  occurredAt: Timestamp;
  duration?: number;
  
  // Outcome
  outcome?: 'positive' | 'neutral' | 'negative';
  nextSteps?: string;
  followUpDate?: Timestamp;
  
  // Attachments
  attachments?: CommunicationAttachment[];
  
  // Metadata
  loggedBy: string;
  createdAt: Timestamp;
}

export interface CommunicationAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

// ----------------------------------------------------------------------------
// MEETING
// ----------------------------------------------------------------------------

export interface InvestorMeeting {
  id: string;
  companyId: string;
  investorId: string;
  investorName: string;
  
  // Meeting details
  title: string;
  type: MeetingType;
  description?: string;
  
  // Participants
  internalAttendees: MeetingAttendee[];
  externalAttendees: MeetingAttendee[];
  
  // Timing
  scheduledStart: Timestamp;
  scheduledEnd: Timestamp;
  actualStart?: Timestamp;
  actualEnd?: Timestamp;
  timezone: string;
  
  // Location
  locationType: 'in_person' | 'video' | 'phone';
  location?: string;
  meetingLink?: string;
  
  // Related entities
  dealId?: string;
  dealName?: string;
  
  // Preparation
  agenda?: string;
  preparationNotes?: string;
  documentsToShare?: string[];
  
  // Outcome (filled after meeting)
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  meetingNotes?: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  keyTakeaways?: string[];
  actionItems?: MeetingActionItem[];
  nextSteps?: string;
  followUpDate?: Timestamp;
  
  // Reminders
  reminderSent: boolean;
  
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MeetingAttendee {
  id: string;
  name: string;
  email: string;
  role?: string;
  confirmed: boolean;
}

export interface MeetingActionItem {
  id: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: Timestamp;
  status: 'pending' | 'completed';
  completedAt?: Timestamp;
}

// ----------------------------------------------------------------------------
// RELATIONSHIP HEALTH
// ----------------------------------------------------------------------------

export interface RelationshipHealthMetrics {
  investorId: string;
  calculatedAt: Timestamp;
  
  // Overall score
  overallScore: number;
  healthLevel: RelationshipHealthLevel;
  trend: 'improving' | 'stable' | 'declining';
  
  // Component scores
  recencyScore: number;
  frequencyScore: number;
  engagementScore: number;
  dealProgressScore: number;
  sentimentScore: number;
  
  // Alerts
  alerts: RelationshipAlert[];
  
  // Recommendations
  recommendations: string[];
}

export interface RelationshipAlert {
  type: 'no_contact' | 'missed_followup' | 'declining_engagement' | 'stalled_deal';
  severity: 'high' | 'medium' | 'low';
  message: string;
  daysSince?: number;
}

// ----------------------------------------------------------------------------
// INVESTOR ANALYTICS
// ----------------------------------------------------------------------------

export interface InvestorAnalytics {
  companyId: string;
  asOfDate: Timestamp;
  
  // Portfolio overview
  totalInvestors: number;
  activeInvestors: number;
  newInvestorsThisMonth: number;
  
  // By type
  typeDistribution: Record<InvestorType, number>;
  
  // By status
  statusDistribution: Record<RelationshipStatus, number>;
  
  // By health
  healthDistribution: Record<RelationshipHealthLevel, number>;
  
  // Engagement metrics
  totalInteractionsThisMonth: number;
  totalMeetingsThisMonth: number;
  averageInteractionsPerInvestor: number;
  
  // Pipeline
  hotLeads: number;
  warmLeads: number;
  activeDealsCount: number;
  
  // At-risk relationships
  atRiskRelationships: number;
  overdueFollowUps: number;
}

// ----------------------------------------------------------------------------
// FILTERS
// ----------------------------------------------------------------------------

export interface InvestorFilters {
  type?: InvestorType;
  status?: RelationshipStatus;
  healthLevel?: RelationshipHealthLevel;
  stages?: InvestmentStage[];
  sectors?: InvestmentSector[];
  geography?: string;
  hasUgandaPresence?: boolean;
  checkSizeMin?: number;
  checkSizeMax?: number;
  ownerId?: string;
  tags?: string[];
}

export interface CommunicationFilters {
  investorId?: string;
  type?: CommunicationType;
  direction?: 'inbound' | 'outbound';
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
}

export interface MeetingFilters {
  investorId?: string;
  type?: MeetingType;
  status?: string;
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
}
