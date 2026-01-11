// ============================================================================
// INVESTOR SCHEMAS
// DawinOS v2.0 - Capital Hub Module
// Zod validation schemas for Investor CRM
// ============================================================================

import { z } from 'zod';
import {
  INVESTOR_TYPES,
  INVESTMENT_STAGES,
  INVESTMENT_SECTORS,
  RELATIONSHIP_STATUSES,
  COMMUNICATION_TYPES,
  MEETING_TYPES,
  CONTACT_ROLES,
  INVESTOR_SOURCES,
} from '../constants/investor.constants';

// Enum schemas
const investorTypeSchema = z.enum([
  INVESTOR_TYPES.ANGEL,
  INVESTOR_TYPES.VENTURE_CAPITAL,
  INVESTOR_TYPES.PRIVATE_EQUITY,
  INVESTOR_TYPES.DFI,
  INVESTOR_TYPES.FAMILY_OFFICE,
  INVESTOR_TYPES.CORPORATE_VC,
  INVESTOR_TYPES.SOVEREIGN_WEALTH,
  INVESTOR_TYPES.PENSION_FUND,
  INVESTOR_TYPES.ENDOWMENT,
  INVESTOR_TYPES.HNWI,
  INVESTOR_TYPES.STRATEGIC,
]);

const investmentStageSchema = z.enum([
  INVESTMENT_STAGES.PRE_SEED,
  INVESTMENT_STAGES.SEED,
  INVESTMENT_STAGES.SERIES_A,
  INVESTMENT_STAGES.SERIES_B,
  INVESTMENT_STAGES.SERIES_C_PLUS,
  INVESTMENT_STAGES.GROWTH,
  INVESTMENT_STAGES.MEZZANINE,
  INVESTMENT_STAGES.BRIDGE,
  INVESTMENT_STAGES.PROJECT_FINANCE,
]);

const investmentSectorSchema = z.enum([
  INVESTMENT_SECTORS.INFRASTRUCTURE,
  INVESTMENT_SECTORS.HEALTHCARE,
  INVESTMENT_SECTORS.AGRICULTURE,
  INVESTMENT_SECTORS.FINTECH,
  INVESTMENT_SECTORS.TECHNOLOGY,
  INVESTMENT_SECTORS.EDUCATION,
  INVESTMENT_SECTORS.ENERGY,
  INVESTMENT_SECTORS.MANUFACTURING,
  INVESTMENT_SECTORS.REAL_ESTATE,
  INVESTMENT_SECTORS.CONSUMER,
  INVESTMENT_SECTORS.LOGISTICS,
  INVESTMENT_SECTORS.CLIMATE,
]);

const relationshipStatusSchema = z.enum([
  RELATIONSHIP_STATUSES.PROSPECT,
  RELATIONSHIP_STATUSES.COLD,
  RELATIONSHIP_STATUSES.WARM,
  RELATIONSHIP_STATUSES.HOT,
  RELATIONSHIP_STATUSES.ACTIVE_INVESTOR,
  RELATIONSHIP_STATUSES.FORMER_INVESTOR,
  RELATIONSHIP_STATUSES.DECLINED,
  RELATIONSHIP_STATUSES.DO_NOT_CONTACT,
]);

const communicationTypeSchema = z.enum([
  COMMUNICATION_TYPES.EMAIL,
  COMMUNICATION_TYPES.CALL,
  COMMUNICATION_TYPES.MEETING,
  COMMUNICATION_TYPES.VIDEO_CALL,
  COMMUNICATION_TYPES.WHATSAPP,
  COMMUNICATION_TYPES.LINKEDIN,
  COMMUNICATION_TYPES.CONFERENCE,
  COMMUNICATION_TYPES.SITE_VISIT,
  COMMUNICATION_TYPES.DOCUMENT_SHARED,
  COMMUNICATION_TYPES.INTRO,
]);

const meetingTypeSchema = z.enum([
  MEETING_TYPES.INTRO_CALL,
  MEETING_TYPES.PITCH,
  MEETING_TYPES.DEEP_DIVE,
  MEETING_TYPES.DUE_DILIGENCE,
  MEETING_TYPES.NEGOTIATION,
  MEETING_TYPES.CLOSING,
  MEETING_TYPES.PORTFOLIO_REVIEW,
  MEETING_TYPES.BOARD_MEETING,
  MEETING_TYPES.SITE_VISIT,
  MEETING_TYPES.NETWORKING,
]);

const contactRoleSchema = z.enum([
  CONTACT_ROLES.PARTNER,
  CONTACT_ROLES.PRINCIPAL,
  CONTACT_ROLES.ASSOCIATE,
  CONTACT_ROLES.ANALYST,
  CONTACT_ROLES.OPERATIONS,
  CONTACT_ROLES.IR,
  CONTACT_ROLES.OTHER,
]);

const investorSourceSchema = z.enum([
  INVESTOR_SOURCES.REFERRAL,
  INVESTOR_SOURCES.CONFERENCE,
  INVESTOR_SOURCES.COLD_OUTREACH,
  INVESTOR_SOURCES.INBOUND,
  INVESTOR_SOURCES.NETWORK,
  INVESTOR_SOURCES.OTHER,
]);

// ----------------------------------------------------------------------------
// INVESTMENT CRITERIA SCHEMA
// ----------------------------------------------------------------------------

export const investmentCriteriaSchema = z.object({
  stages: z.array(investmentStageSchema).min(1),
  sectors: z.array(investmentSectorSchema).min(1),
  geographies: z.array(z.string()).min(1),
  checkSizeMin: z.number().positive(),
  checkSizeMax: z.number().positive(),
  ownershipPreference: z.enum(['minority', 'majority', 'control', 'flexible']).optional(),
  instrumentTypes: z.array(z.enum(['equity', 'debt', 'convertible', 'mezzanine', 'grant'])).min(1),
  impactFocus: z.boolean().optional(),
  impactThemes: z.array(z.string()).optional(),
  coInvestPreference: z.boolean().optional(),
  leadPreference: z.enum(['lead', 'follow', 'either']).optional(),
  investmentHorizon: z.number().min(1).max(15).optional(),
  exclusions: z.array(z.string()).optional(),
}).refine(data => data.checkSizeMin <= data.checkSizeMax, {
  message: 'Minimum check size must be less than or equal to maximum',
});

export type InvestmentCriteriaInput = z.infer<typeof investmentCriteriaSchema>;

// ----------------------------------------------------------------------------
// INVESTOR SCHEMAS
// ----------------------------------------------------------------------------

export const investorInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: investorTypeSchema,
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedIn: z.string().url().optional().or(z.literal('')),
  organizationName: z.string().max(200).optional(),
  aum: z.number().positive().optional(),
  fundSize: z.number().positive().optional(),
  fundVintage: z.number().min(1990).max(2030).optional(),
  headquarters: z.string().min(1).max(200),
  operatingRegions: z.array(z.string()).min(1),
  hasUgandaPresence: z.boolean(),
  localOffice: z.string().max(200).optional(),
  investmentCriteria: investmentCriteriaSchema,
  relationshipStatus: relationshipStatusSchema,
  source: investorSourceSchema,
  referredBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
});

export type InvestorInput = z.infer<typeof investorInputSchema>;

export const investorUpdateSchema = investorInputSchema.partial();

export type InvestorUpdate = z.infer<typeof investorUpdateSchema>;

// ----------------------------------------------------------------------------
// CONTACT SCHEMAS
// ----------------------------------------------------------------------------

export const investorContactInputSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  role: contactRoleSchema,
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  mobile: z.string().max(20).optional(),
  whatsApp: z.string().max(20).optional(),
  linkedIn: z.string().url().optional().or(z.literal('')),
  preferredContactMethod: z.enum([
    COMMUNICATION_TYPES.EMAIL,
    COMMUNICATION_TYPES.CALL,
    COMMUNICATION_TYPES.WHATSAPP,
    COMMUNICATION_TYPES.LINKEDIN,
  ]),
  timezone: z.string().optional(),
  isPrimary: z.boolean(),
  isDecisionMaker: z.boolean(),
  influence: z.enum(['high', 'medium', 'low']),
  notes: z.string().max(2000).optional(),
});

export type InvestorContactInput = z.infer<typeof investorContactInputSchema>;

// ----------------------------------------------------------------------------
// COMMUNICATION SCHEMAS
// ----------------------------------------------------------------------------

export const communicationInputSchema = z.object({
  investorId: z.string().min(1),
  contactId: z.string().optional(),
  type: communicationTypeSchema,
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().min(1).max(200),
  summary: z.string().min(1).max(5000),
  dealId: z.string().optional(),
  occurredAt: z.date(),
  duration: z.number().min(1).optional(),
  outcome: z.enum(['positive', 'neutral', 'negative']).optional(),
  nextSteps: z.string().max(1000).optional(),
  followUpDate: z.date().optional(),
});

export type CommunicationInput = z.infer<typeof communicationInputSchema>;

// ----------------------------------------------------------------------------
// MEETING SCHEMAS
// ----------------------------------------------------------------------------

export const meetingAttendeeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.string().max(200).optional(),
});

export type MeetingAttendeeInput = z.infer<typeof meetingAttendeeSchema>;

export const meetingActionItemSchema = z.object({
  description: z.string().min(1).max(500),
  assigneeId: z.string().min(1),
  assigneeName: z.string().min(1),
  dueDate: z.date(),
});

export type MeetingActionItemInput = z.infer<typeof meetingActionItemSchema>;

export const investorMeetingInputSchema = z.object({
  investorId: z.string().min(1),
  title: z.string().min(1).max(200),
  type: meetingTypeSchema,
  description: z.string().max(2000).optional(),
  internalAttendees: z.array(meetingAttendeeSchema).min(1),
  externalAttendees: z.array(meetingAttendeeSchema).min(1),
  scheduledStart: z.date(),
  scheduledEnd: z.date(),
  timezone: z.string().default('Africa/Kampala'),
  locationType: z.enum(['in_person', 'video', 'phone']),
  location: z.string().max(500).optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  dealId: z.string().optional(),
  agenda: z.string().max(5000).optional(),
  preparationNotes: z.string().max(5000).optional(),
}).refine(data => data.scheduledStart < data.scheduledEnd, {
  message: 'Meeting end time must be after start time',
});

export type InvestorMeetingInput = z.infer<typeof investorMeetingInputSchema>;

export const meetingOutcomeInputSchema = z.object({
  status: z.enum(['completed', 'cancelled', 'no_show']),
  actualStart: z.date().optional(),
  actualEnd: z.date().optional(),
  meetingNotes: z.string().max(10000).optional(),
  outcome: z.enum(['positive', 'neutral', 'negative']).optional(),
  keyTakeaways: z.array(z.string()).optional(),
  actionItems: z.array(meetingActionItemSchema).optional(),
  nextSteps: z.string().max(2000).optional(),
  followUpDate: z.date().optional(),
});

export type MeetingOutcomeInput = z.infer<typeof meetingOutcomeInputSchema>;
