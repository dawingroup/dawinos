// ============================================================================
// INVESTOR SERVICE
// DawinOS v2.0 - Capital Hub Module
// Service for Investor CRM & Relationship Management
// ============================================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase/firestore';
import {
  Investor,
  InvestorContact,
  Communication,
  InvestorMeeting,
  RelationshipHealthMetrics,
  InvestorAnalytics,
  InvestorFilters,
  CommunicationFilters,
  MeetingFilters,
  RelationshipAlert,
} from '../types/investor.types';
import {
  InvestorInput,
  InvestorContactInput,
  CommunicationInput,
  InvestorMeetingInput,
  MeetingOutcomeInput,
} from '../schemas/investor.schemas';
import {
  RELATIONSHIP_HEALTH_LEVELS,
  HEALTH_SCORE_THRESHOLDS,
  INVESTORS_COLLECTION,
  INVESTOR_COMMUNICATIONS_COLLECTION,
  INVESTOR_MEETINGS_COLLECTION,
  RelationshipHealthLevel,
} from '../constants/investor.constants';

// Collection references
const investorsCollection = (companyId: string) =>
  collection(db, 'companies', companyId, INVESTORS_COLLECTION);
const communicationsCollection = (companyId: string) =>
  collection(db, 'companies', companyId, INVESTOR_COMMUNICATIONS_COLLECTION);
const meetingsCollection = (companyId: string) =>
  collection(db, 'companies', companyId, INVESTOR_MEETINGS_COLLECTION);

// ============================================================================
// INVESTOR OPERATIONS
// ============================================================================

export const createInvestor = async (
  companyId: string,
  input: InvestorInput,
  ownerId: string,
  ownerName: string
): Promise<Investor> => {
  const now = Timestamp.now();

  const data: Omit<Investor, 'id'> = {
    companyId,
    name: input.name,
    type: input.type,
    description: input.description,
    website: input.website,
    linkedIn: input.linkedIn,
    organizationName: input.organizationName,
    aum: input.aum,
    fundSize: input.fundSize,
    fundVintage: input.fundVintage,
    headquarters: input.headquarters,
    operatingRegions: input.operatingRegions,
    hasUgandaPresence: input.hasUgandaPresence,
    localOffice: input.localOffice,
    investmentCriteria: input.investmentCriteria,
    contacts: [],
    relationshipStatus: input.relationshipStatus,
    relationshipOwnerId: ownerId,
    relationshipOwnerName: ownerName,
    relationshipHealth: RELATIONSHIP_HEALTH_LEVELS.FAIR,
    healthScore: 50,
    totalInteractions: 0,
    totalMeetings: 0,
    totalDeals: 0,
    activeDeals: 0,
    source: input.source,
    referredBy: input.referredBy,
    tags: input.tags || [],
    notes: input.notes,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(investorsCollection(companyId), data);
  return { id: docRef.id, ...data };
};

export const getInvestor = async (
  companyId: string,
  investorId: string
): Promise<Investor | null> => {
  const docRef = doc(investorsCollection(companyId), investorId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Investor;
};

export const getInvestors = async (
  companyId: string,
  filters?: InvestorFilters
): Promise<Investor[]> => {
  const constraints = [where('isActive', '==', true)];

  if (filters?.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters?.status) {
    constraints.push(where('relationshipStatus', '==', filters.status));
  }
  if (filters?.healthLevel) {
    constraints.push(where('relationshipHealth', '==', filters.healthLevel));
  }
  if (filters?.ownerId) {
    constraints.push(where('relationshipOwnerId', '==', filters.ownerId));
  }
  if (filters?.hasUgandaPresence !== undefined) {
    constraints.push(where('hasUgandaPresence', '==', filters.hasUgandaPresence));
  }

  const q = query(investorsCollection(companyId), ...constraints, orderBy('name'));
  const snapshot = await getDocs(q);
  let investors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Investor[];

  // Client-side filtering for complex criteria
  if (filters?.stages?.length) {
    investors = investors.filter(i => 
      i.investmentCriteria.stages.some(s => filters.stages!.includes(s))
    );
  }
  if (filters?.sectors?.length) {
    investors = investors.filter(i => 
      i.investmentCriteria.sectors.some(s => filters.sectors!.includes(s))
    );
  }
  if (filters?.checkSizeMin) {
    investors = investors.filter(i => i.investmentCriteria.checkSizeMax >= filters.checkSizeMin!);
  }
  if (filters?.checkSizeMax) {
    investors = investors.filter(i => i.investmentCriteria.checkSizeMin <= filters.checkSizeMax!);
  }
  if (filters?.tags?.length) {
    investors = investors.filter(i => 
      filters.tags!.some(t => i.tags.includes(t))
    );
  }

  return investors;
};

export const updateInvestor = async (
  companyId: string,
  investorId: string,
  updates: Partial<InvestorInput>
): Promise<Investor> => {
  const docRef = doc(investorsCollection(companyId), investorId);
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });

  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as Investor;
};

export const deleteInvestor = async (
  companyId: string,
  investorId: string
): Promise<void> => {
  const docRef = doc(investorsCollection(companyId), investorId);
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: Timestamp.now(),
  });
};

// ============================================================================
// CONTACT OPERATIONS
// ============================================================================

export const addContact = async (
  companyId: string,
  investorId: string,
  input: InvestorContactInput
): Promise<InvestorContact> => {
  const now = Timestamp.now();
  const investorRef = doc(investorsCollection(companyId), investorId);
  const investorDoc = await getDoc(investorRef);

  if (!investorDoc.exists()) {
    throw new Error('Investor not found');
  }

  const investor = { id: investorDoc.id, ...investorDoc.data() } as Investor;

  const contact: InvestorContact = {
    id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    investorId,
    firstName: input.firstName,
    lastName: input.lastName,
    title: input.title,
    role: input.role,
    email: input.email,
    phone: input.phone,
    mobile: input.mobile,
    whatsApp: input.whatsApp,
    linkedIn: input.linkedIn,
    preferredContactMethod: input.preferredContactMethod,
    timezone: input.timezone,
    isPrimary: input.isPrimary,
    isDecisionMaker: input.isDecisionMaker,
    influence: input.influence,
    notes: input.notes,
    totalInteractions: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  // If this is primary contact, unset others
  let contacts = investor.contacts;
  if (input.isPrimary) {
    contacts = contacts.map(c => ({ ...c, isPrimary: false }));
  }
  contacts.push(contact);

  await updateDoc(investorRef, {
    contacts,
    primaryContactId: input.isPrimary ? contact.id : investor.primaryContactId,
    updatedAt: now,
  });

  return contact;
};

export const updateContact = async (
  companyId: string,
  investorId: string,
  contactId: string,
  updates: Partial<InvestorContactInput>
): Promise<InvestorContact> => {
  const now = Timestamp.now();
  const investorRef = doc(investorsCollection(companyId), investorId);
  const investorDoc = await getDoc(investorRef);

  if (!investorDoc.exists()) {
    throw new Error('Investor not found');
  }

  const investor = { id: investorDoc.id, ...investorDoc.data() } as Investor;
  const contactIndex = investor.contacts.findIndex(c => c.id === contactId);

  if (contactIndex === -1) {
    throw new Error('Contact not found');
  }

  let contacts = investor.contacts;
  
  // If setting as primary, unset others
  if (updates.isPrimary) {
    contacts = contacts.map(c => ({ ...c, isPrimary: false }));
  }

  const updatedContact = {
    ...contacts[contactIndex],
    ...updates,
    updatedAt: now,
  };
  contacts[contactIndex] = updatedContact;

  await updateDoc(investorRef, {
    contacts,
    primaryContactId: updates.isPrimary ? contactId : investor.primaryContactId,
    updatedAt: now,
  });

  return updatedContact;
};

export const removeContact = async (
  companyId: string,
  investorId: string,
  contactId: string
): Promise<void> => {
  const now = Timestamp.now();
  const investorRef = doc(investorsCollection(companyId), investorId);
  const investorDoc = await getDoc(investorRef);

  if (!investorDoc.exists()) {
    throw new Error('Investor not found');
  }

  const investor = { id: investorDoc.id, ...investorDoc.data() } as Investor;
  const contacts = investor.contacts.filter(c => c.id !== contactId);
  
  const newPrimaryContactId = investor.primaryContactId === contactId
    ? contacts[0]?.id
    : investor.primaryContactId;

  await updateDoc(investorRef, {
    contacts,
    primaryContactId: newPrimaryContactId,
    updatedAt: now,
  });
};

// ============================================================================
// COMMUNICATION OPERATIONS
// ============================================================================

export const logCommunication = async (
  companyId: string,
  input: CommunicationInput,
  loggedBy: string
): Promise<Communication> => {
  const now = Timestamp.now();

  // Get investor info
  const investor = await getInvestor(companyId, input.investorId);
  if (!investor) {
    throw new Error('Investor not found');
  }

  // Get contact info if provided
  let contactName: string | undefined;
  if (input.contactId) {
    const contact = investor.contacts.find(c => c.id === input.contactId);
    contactName = contact ? `${contact.firstName} ${contact.lastName}` : undefined;
  }

  const communication: Omit<Communication, 'id'> = {
    companyId,
    investorId: input.investorId,
    investorName: investor.name,
    contactId: input.contactId,
    contactName,
    type: input.type,
    direction: input.direction,
    subject: input.subject,
    summary: input.summary,
    dealId: input.dealId,
    occurredAt: Timestamp.fromDate(input.occurredAt),
    duration: input.duration,
    outcome: input.outcome,
    nextSteps: input.nextSteps,
    followUpDate: input.followUpDate ? Timestamp.fromDate(input.followUpDate) : undefined,
    loggedBy,
    createdAt: now,
  };

  const docRef = await addDoc(communicationsCollection(companyId), communication);

  // Update investor metrics
  const investorRef = doc(investorsCollection(companyId), input.investorId);
  await updateDoc(investorRef, {
    lastContactDate: Timestamp.fromDate(input.occurredAt),
    nextFollowUpDate: input.followUpDate ? Timestamp.fromDate(input.followUpDate) : null,
    totalInteractions: increment(1),
    updatedAt: now,
  });

  // Recalculate health score
  await recalculateRelationshipHealth(companyId, input.investorId);

  return { id: docRef.id, ...communication };
};

export const getCommunications = async (
  companyId: string,
  filters?: CommunicationFilters
): Promise<Communication[]> => {
  const constraints = [];

  if (filters?.investorId) {
    constraints.push(where('investorId', '==', filters.investorId));
  }
  if (filters?.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters?.direction) {
    constraints.push(where('direction', '==', filters.direction));
  }

  const q = constraints.length > 0
    ? query(communicationsCollection(companyId), ...constraints, orderBy('occurredAt', 'desc'))
    : query(communicationsCollection(companyId), orderBy('occurredAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Communication[];
};

// ============================================================================
// MEETING OPERATIONS
// ============================================================================

export const scheduleMeeting = async (
  companyId: string,
  input: InvestorMeetingInput,
  createdBy: string
): Promise<InvestorMeeting> => {
  const now = Timestamp.now();

  // Get investor info
  const investor = await getInvestor(companyId, input.investorId);
  if (!investor) {
    throw new Error('Investor not found');
  }

  const meeting: Omit<InvestorMeeting, 'id'> = {
    companyId,
    investorId: input.investorId,
    investorName: investor.name,
    title: input.title,
    type: input.type,
    description: input.description,
    internalAttendees: input.internalAttendees.map((a, i) => ({
      ...a,
      id: `int-${i}-${Date.now()}`,
      confirmed: true,
    })),
    externalAttendees: input.externalAttendees.map((a, i) => ({
      ...a,
      id: `ext-${i}-${Date.now()}`,
      confirmed: false,
    })),
    scheduledStart: Timestamp.fromDate(input.scheduledStart),
    scheduledEnd: Timestamp.fromDate(input.scheduledEnd),
    timezone: input.timezone,
    locationType: input.locationType,
    location: input.location,
    meetingLink: input.meetingLink,
    dealId: input.dealId,
    agenda: input.agenda,
    preparationNotes: input.preparationNotes,
    status: 'scheduled',
    reminderSent: false,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(meetingsCollection(companyId), meeting);

  return { id: docRef.id, ...meeting };
};

export const getMeeting = async (
  companyId: string,
  meetingId: string
): Promise<InvestorMeeting | null> => {
  const docRef = doc(meetingsCollection(companyId), meetingId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as InvestorMeeting;
};

export const getMeetings = async (
  companyId: string,
  filters?: MeetingFilters
): Promise<InvestorMeeting[]> => {
  const constraints = [];

  if (filters?.investorId) {
    constraints.push(where('investorId', '==', filters.investorId));
  }
  if (filters?.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  const q = constraints.length > 0
    ? query(meetingsCollection(companyId), ...constraints, orderBy('scheduledStart', 'desc'))
    : query(meetingsCollection(companyId), orderBy('scheduledStart', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InvestorMeeting[];
};

export const updateMeeting = async (
  companyId: string,
  meetingId: string,
  updates: Partial<InvestorMeetingInput>
): Promise<InvestorMeeting> => {
  const now = Timestamp.now();
  const meetingRef = doc(meetingsCollection(companyId), meetingId);
  
  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: now,
  };

  if (updates.scheduledStart) {
    updateData.scheduledStart = Timestamp.fromDate(updates.scheduledStart);
  }
  if (updates.scheduledEnd) {
    updateData.scheduledEnd = Timestamp.fromDate(updates.scheduledEnd);
  }

  await updateDoc(meetingRef, updateData);

  const updated = await getDoc(meetingRef);
  return { id: updated.id, ...updated.data() } as InvestorMeeting;
};

export const completeMeeting = async (
  companyId: string,
  meetingId: string,
  input: MeetingOutcomeInput
): Promise<InvestorMeeting> => {
  const now = Timestamp.now();
  const meetingRef = doc(meetingsCollection(companyId), meetingId);
  const meetingDoc = await getDoc(meetingRef);

  if (!meetingDoc.exists()) {
    throw new Error('Meeting not found');
  }

  const meeting = { id: meetingDoc.id, ...meetingDoc.data() } as InvestorMeeting;

  const updates: Record<string, unknown> = {
    status: input.status,
    meetingNotes: input.meetingNotes,
    outcome: input.outcome,
    keyTakeaways: input.keyTakeaways,
    nextSteps: input.nextSteps,
    followUpDate: input.followUpDate ? Timestamp.fromDate(input.followUpDate) : null,
    updatedAt: now,
  };

  if (input.actualStart) {
    updates.actualStart = Timestamp.fromDate(input.actualStart);
  }
  if (input.actualEnd) {
    updates.actualEnd = Timestamp.fromDate(input.actualEnd);
  }
  if (input.actionItems) {
    updates.actionItems = input.actionItems.map((a, i) => ({
      ...a,
      id: `action-${i}-${Date.now()}`,
      dueDate: Timestamp.fromDate(a.dueDate),
      status: 'pending',
    }));
  }

  await updateDoc(meetingRef, updates);

  // Update investor metrics
  if (input.status === 'completed') {
    const investorRef = doc(investorsCollection(companyId), meeting.investorId);
    await updateDoc(investorRef, {
      lastContactDate: now,
      nextFollowUpDate: input.followUpDate ? Timestamp.fromDate(input.followUpDate) : null,
      totalMeetings: increment(1),
      totalInteractions: increment(1),
      updatedAt: now,
    });

    // Recalculate health
    await recalculateRelationshipHealth(companyId, meeting.investorId);
  }

  return { ...meeting, ...updates } as InvestorMeeting;
};

export const cancelMeeting = async (
  companyId: string,
  meetingId: string,
  reason?: string
): Promise<void> => {
  const meetingRef = doc(meetingsCollection(companyId), meetingId);
  await updateDoc(meetingRef, {
    status: 'cancelled',
    meetingNotes: reason,
    updatedAt: Timestamp.now(),
  });
};

// ============================================================================
// RELATIONSHIP HEALTH
// ============================================================================

export const recalculateRelationshipHealth = async (
  companyId: string,
  investorId: string
): Promise<RelationshipHealthMetrics> => {
  const now = Timestamp.now();
  const investor = await getInvestor(companyId, investorId);
  
  if (!investor) {
    throw new Error('Investor not found');
  }

  // Calculate recency score (days since last contact)
  let recencyScore = 100;
  let daysSinceContact: number | undefined;
  if (investor.lastContactDate) {
    daysSinceContact = Math.floor(
      (now.toMillis() - investor.lastContactDate.toMillis()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact <= 7) recencyScore = 100;
    else if (daysSinceContact <= 14) recencyScore = 80;
    else if (daysSinceContact <= 30) recencyScore = 60;
    else if (daysSinceContact <= 60) recencyScore = 40;
    else if (daysSinceContact <= 90) recencyScore = 20;
    else recencyScore = 0;
  } else {
    recencyScore = 0;
  }

  // Calculate frequency score (interactions per month benchmark)
  const frequencyBenchmark = 2;
  const monthsActive = Math.max(1, Math.floor(
    (now.toMillis() - investor.createdAt.toMillis()) / (1000 * 60 * 60 * 24 * 30)
  ));
  const expectedInteractions = monthsActive * frequencyBenchmark;
  const frequencyScore = Math.min(100, Math.round((investor.totalInteractions / expectedInteractions) * 100));

  // Engagement score (based on meetings ratio)
  const engagementScore = investor.totalMeetings > 0 
    ? Math.min(100, Math.round((investor.totalMeetings / investor.totalInteractions) * 200))
    : 0;

  // Deal progress score
  const dealProgressScore = investor.activeDeals > 0 ? 80 : 
    investor.totalDeals > 0 ? 40 : 20;

  // Sentiment score (default to neutral)
  const sentimentScore = 60;

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    recencyScore * 0.3 +
    frequencyScore * 0.2 +
    engagementScore * 0.2 +
    dealProgressScore * 0.2 +
    sentimentScore * 0.1
  );

  // Determine health level
  let healthLevel: RelationshipHealthLevel;
  if (overallScore >= HEALTH_SCORE_THRESHOLDS[RELATIONSHIP_HEALTH_LEVELS.EXCELLENT]) {
    healthLevel = RELATIONSHIP_HEALTH_LEVELS.EXCELLENT;
  } else if (overallScore >= HEALTH_SCORE_THRESHOLDS[RELATIONSHIP_HEALTH_LEVELS.GOOD]) {
    healthLevel = RELATIONSHIP_HEALTH_LEVELS.GOOD;
  } else if (overallScore >= HEALTH_SCORE_THRESHOLDS[RELATIONSHIP_HEALTH_LEVELS.FAIR]) {
    healthLevel = RELATIONSHIP_HEALTH_LEVELS.FAIR;
  } else if (overallScore >= HEALTH_SCORE_THRESHOLDS[RELATIONSHIP_HEALTH_LEVELS.POOR]) {
    healthLevel = RELATIONSHIP_HEALTH_LEVELS.POOR;
  } else {
    healthLevel = RELATIONSHIP_HEALTH_LEVELS.AT_RISK;
  }

  // Generate alerts
  const alerts: RelationshipAlert[] = [];
  
  if (recencyScore < 40) {
    alerts.push({
      type: 'no_contact',
      severity: recencyScore === 0 ? 'high' : 'medium',
      message: `No contact in ${daysSinceContact || 'unknown'} days`,
      daysSince: daysSinceContact,
    });
  }

  if (investor.nextFollowUpDate && investor.nextFollowUpDate.toMillis() < now.toMillis()) {
    alerts.push({
      type: 'missed_followup',
      severity: 'high',
      message: 'Overdue follow-up',
    });
  }

  // Update investor record
  const investorRef = doc(investorsCollection(companyId), investorId);
  await updateDoc(investorRef, {
    relationshipHealth: healthLevel,
    healthScore: overallScore,
    updatedAt: now,
  });

  // Generate recommendations
  const recommendations: string[] = [];
  if (recencyScore < 60) {
    recommendations.push('Schedule a catch-up call or meeting');
  }
  if (engagementScore < 40) {
    recommendations.push('Propose an in-person meeting or site visit');
  }
  if (investor.activeDeals === 0 && investor.relationshipStatus === 'warm') {
    recommendations.push('Consider introducing a new investment opportunity');
  }

  return {
    investorId,
    calculatedAt: now,
    overallScore,
    healthLevel,
    trend: 'stable',
    recencyScore,
    frequencyScore,
    engagementScore,
    dealProgressScore,
    sentimentScore,
    alerts,
    recommendations,
  };
};

// ============================================================================
// ANALYTICS
// ============================================================================

export const getInvestorAnalytics = async (
  companyId: string
): Promise<InvestorAnalytics> => {
  const now = Timestamp.now();
  const investors = await getInvestors(companyId);

  // Calculate distributions
  const typeDistribution: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};
  const healthDistribution: Record<string, number> = {};

  investors.forEach(i => {
    typeDistribution[i.type] = (typeDistribution[i.type] || 0) + 1;
    statusDistribution[i.relationshipStatus] = (statusDistribution[i.relationshipStatus] || 0) + 1;
    healthDistribution[i.relationshipHealth] = (healthDistribution[i.relationshipHealth] || 0) + 1;
  });

  // Count by status
  const activeInvestors = investors.filter(i => i.relationshipStatus === 'active_investor').length;
  const hotLeads = investors.filter(i => i.relationshipStatus === 'hot').length;
  const warmLeads = investors.filter(i => i.relationshipStatus === 'warm').length;
  const atRiskRelationships = investors.filter(i => i.relationshipHealth === 'at_risk').length;

  // Overdue follow-ups
  const overdueFollowUps = investors.filter(i => 
    i.nextFollowUpDate && i.nextFollowUpDate.toMillis() < now.toMillis()
  ).length;

  // New this month
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const newInvestorsThisMonth = investors.filter(i => 
    i.createdAt.toDate() >= monthAgo
  ).length;

  // Get communications this month
  const communications = await getCommunications(companyId);
  const commsThisMonth = communications.filter(c => 
    c.occurredAt.toDate() >= monthAgo
  );

  // Get meetings this month
  const meetings = await getMeetings(companyId);
  const meetingsThisMonth = meetings.filter(m => 
    m.scheduledStart.toDate() >= monthAgo && m.status === 'completed'
  );

  return {
    companyId,
    asOfDate: now,
    totalInvestors: investors.length,
    activeInvestors,
    newInvestorsThisMonth,
    typeDistribution: typeDistribution as InvestorAnalytics['typeDistribution'],
    statusDistribution: statusDistribution as InvestorAnalytics['statusDistribution'],
    healthDistribution: healthDistribution as InvestorAnalytics['healthDistribution'],
    totalInteractionsThisMonth: commsThisMonth.length,
    totalMeetingsThisMonth: meetingsThisMonth.length,
    averageInteractionsPerInvestor: investors.length > 0 
      ? Math.round(investors.reduce((sum, i) => sum + i.totalInteractions, 0) / investors.length)
      : 0,
    hotLeads,
    warmLeads,
    activeDealsCount: investors.reduce((sum, i) => sum + i.activeDeals, 0),
    atRiskRelationships,
    overdueFollowUps,
  };
};

// ============================================================================
// MATCHING
// ============================================================================

export const findMatchingInvestors = async (
  companyId: string,
  criteria: {
    sector?: string;
    stage?: string;
    amount?: number;
    geography?: string;
  }
): Promise<Investor[]> => {
  const investors = await getInvestors(companyId);

  return investors.filter(investor => {
    const ic = investor.investmentCriteria;

    // Match sector
    if (criteria.sector && !ic.sectors.includes(criteria.sector as any)) {
      return false;
    }

    // Match stage
    if (criteria.stage && !ic.stages.includes(criteria.stage as any)) {
      return false;
    }

    // Match amount
    if (criteria.amount) {
      if (criteria.amount < ic.checkSizeMin || criteria.amount > ic.checkSizeMax) {
        return false;
      }
    }

    // Match geography
    if (criteria.geography && !ic.geographies.includes(criteria.geography)) {
      return false;
    }

    return true;
  });
};
