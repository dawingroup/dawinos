// ============================================================================
// COMMUNICATION LOG
// DawinOS v2.0 - Capital Hub Module
// Timeline of investor communications
// ============================================================================

import React from 'react';
import {
  Mail,
  Phone,
  Video,
  Users,
  MessageSquare,
  Linkedin,
  MapPin,
  FileText,
  UserPlus,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from 'lucide-react';
import { Communication } from '../../types/investor.types';
import {
  COMMUNICATION_TYPE_LABELS,
  CommunicationType,
} from '../../constants/investor.constants';

interface CommunicationLogProps {
  communications: Communication[];
  onAddCommunication?: () => void;
  maxItems?: number;
}

const getTypeIcon = (type: CommunicationType) => {
  switch (type) {
    case 'email': return Mail;
    case 'call': return Phone;
    case 'video_call': return Video;
    case 'meeting': return Users;
    case 'whatsapp': return MessageSquare;
    case 'linkedin': return Linkedin;
    case 'conference': return Calendar;
    case 'site_visit': return MapPin;
    case 'document_shared': return FileText;
    case 'intro': return UserPlus;
    default: return Mail;
  }
};

const getOutcomeIcon = (outcome?: 'positive' | 'neutral' | 'negative') => {
  switch (outcome) {
    case 'positive': return { icon: ThumbsUp, color: 'text-green-500' };
    case 'negative': return { icon: ThumbsDown, color: 'text-red-500' };
    default: return { icon: Minus, color: 'text-gray-400' };
  }
};

const formatDate = (timestamp: { toDate: () => Date }): string => {
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeDate = (timestamp: { toDate: () => Date }): string => {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const CommunicationLog: React.FC<CommunicationLogProps> = ({
  communications,
  onAddCommunication,
  maxItems,
}) => {
  const displayComms = maxItems ? communications.slice(0, maxItems) : communications;

  if (communications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No communications yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Log your first interaction with this investor
          </p>
          {onAddCommunication && (
            <button
              onClick={onAddCommunication}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Log Communication
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Communication History</h3>
        {onAddCommunication && (
          <button
            onClick={onAddCommunication}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Log Communication
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {displayComms.map((comm, index) => {
          const TypeIcon = getTypeIcon(comm.type as CommunicationType);
          const outcomeInfo = getOutcomeIcon(comm.outcome);
          const OutcomeIcon = outcomeInfo.icon;

          return (
            <div key={comm.id} className="p-4 hover:bg-gray-50">
              <div className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    comm.direction === 'outbound' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <TypeIcon className={`w-4 h-4 ${
                      comm.direction === 'outbound' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  {index < displayComms.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{comm.subject}</span>
                        {comm.direction === 'outbound' ? (
                          <ArrowUpRight className="w-3 h-3 text-blue-500" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                        <span>{COMMUNICATION_TYPE_LABELS[comm.type as CommunicationType]}</span>
                        {comm.contactName && (
                          <>
                            <span>•</span>
                            <span>{comm.contactName}</span>
                          </>
                        )}
                        {comm.duration && (
                          <>
                            <span>•</span>
                            <span>{comm.duration} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <OutcomeIcon className={`w-4 h-4 ${outcomeInfo.color}`} />
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatRelativeDate(comm.occurredAt)}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {comm.summary}
                  </p>

                  {/* Next Steps */}
                  {comm.nextSteps && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
                      <span className="font-medium text-amber-700">Next: </span>
                      <span className="text-amber-600">{comm.nextSteps}</span>
                    </div>
                  )}

                  {/* Deal Link */}
                  {comm.dealName && (
                    <div className="mt-2 text-xs text-gray-500">
                      Related to: <span className="text-indigo-600">{comm.dealName}</span>
                    </div>
                  )}

                  {/* Follow-up Date */}
                  {comm.followUpDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Follow-up: {formatDate(comm.followUpDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {maxItems && communications.length > maxItems && (
        <div className="p-3 border-t border-gray-200 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View all {communications.length} communications
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunicationLog;
