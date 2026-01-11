// ============================================================================
// MEETING SCHEDULER
// DawinOS v2.0 - Capital Hub Module
// Displays and manages investor meetings
// ============================================================================

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { InvestorMeeting } from '../../types/investor.types';
import {
  MEETING_TYPE_LABELS,
  MeetingType,
} from '../../constants/investor.constants';

interface MeetingSchedulerProps {
  meetings: InvestorMeeting[];
  onScheduleMeeting?: () => void;
  onViewMeeting?: (meeting: InvestorMeeting) => void;
  onCompleteMeeting?: (meeting: InvestorMeeting) => void;
  showUpcoming?: boolean;
  maxItems?: number;
}

const formatTime = (timestamp: { toDate: () => Date }): string => {
  return timestamp.toDate().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusConfig = (status: InvestorMeeting['status']) => {
  switch (status) {
    case 'scheduled':
      return { color: 'text-blue-600 bg-blue-50', icon: Calendar, label: 'Scheduled' };
    case 'confirmed':
      return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Confirmed' };
    case 'completed':
      return { color: 'text-gray-600 bg-gray-100', icon: CheckCircle, label: 'Completed' };
    case 'cancelled':
      return { color: 'text-red-600 bg-red-50', icon: XCircle, label: 'Cancelled' };
    case 'no_show':
      return { color: 'text-amber-600 bg-amber-50', icon: AlertCircle, label: 'No Show' };
    default:
      return { color: 'text-gray-600 bg-gray-100', icon: Calendar, label: status };
  }
};

const getLocationIcon = (type: 'in_person' | 'video' | 'phone') => {
  switch (type) {
    case 'in_person': return MapPin;
    case 'video': return Video;
    case 'phone': return Phone;
  }
};

export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  meetings,
  onScheduleMeeting,
  onViewMeeting,
  onCompleteMeeting,
  showUpcoming = true,
  maxItems,
}) => {
  const now = new Date();
  
  // Separate upcoming and past meetings
  const upcomingMeetings = meetings
    .filter(m => m.scheduledStart.toDate() > now && m.status !== 'cancelled')
    .sort((a, b) => a.scheduledStart.toMillis() - b.scheduledStart.toMillis());
  
  const pastMeetings = meetings
    .filter(m => m.scheduledStart.toDate() <= now || m.status === 'cancelled' || m.status === 'completed')
    .sort((a, b) => b.scheduledStart.toMillis() - a.scheduledStart.toMillis());

  const displayMeetings = showUpcoming ? upcomingMeetings : pastMeetings;
  const limitedMeetings = maxItems ? displayMeetings.slice(0, maxItems) : displayMeetings;

  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No meetings scheduled</p>
          <p className="text-sm text-gray-500 mt-1">
            Schedule your first meeting with this investor
          </p>
          {onScheduleMeeting && (
            <button
              onClick={onScheduleMeeting}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Schedule Meeting
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900">
            {showUpcoming ? 'Upcoming Meetings' : 'Past Meetings'}
          </h3>
          <p className="text-sm text-gray-500">
            {upcomingMeetings.length} upcoming, {pastMeetings.length} completed
          </p>
        </div>
        {onScheduleMeeting && (
          <button
            onClick={onScheduleMeeting}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Schedule
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {limitedMeetings.map((meeting) => {
          const statusConfig = getStatusConfig(meeting.status);
          const LocationIcon = getLocationIcon(meeting.locationType);
          const isUpcoming = meeting.scheduledStart.toDate() > now;
          const needsCompletion = meeting.status === 'confirmed' && !isUpcoming;

          return (
            <div
              key={meeting.id}
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onViewMeeting?.(meeting)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Date Box */}
                  <div className="w-14 h-14 bg-indigo-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-indigo-600 font-medium">
                      {meeting.scheduledStart.toDate().toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-indigo-600">
                      {meeting.scheduledStart.toDate().getDate()}
                    </span>
                  </div>

                  {/* Meeting Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {MEETING_TYPE_LABELS[meeting.type as MeetingType]}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <LocationIcon className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{meeting.locationType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {meeting.internalAttendees.length + meeting.externalAttendees.length} attendees
                      </span>
                      {meeting.externalAttendees.some(a => a.confirmed) && (
                        <span className="text-xs text-green-600">
                          {meeting.externalAttendees.filter(a => a.confirmed).length} confirmed
                        </span>
                      )}
                    </div>

                    {/* Deal Link */}
                    {meeting.dealName && (
                      <div className="mt-2 text-xs text-gray-500">
                        Deal: <span className="text-indigo-600">{meeting.dealName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {needsCompletion && onCompleteMeeting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteMeeting(meeting);
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Complete
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Outcome (for completed meetings) */}
              {meeting.status === 'completed' && meeting.outcome && (
                <div className={`mt-3 ml-17 p-2 rounded text-sm ${
                  meeting.outcome === 'positive' ? 'bg-green-50 text-green-700' :
                  meeting.outcome === 'negative' ? 'bg-red-50 text-red-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  Outcome: {meeting.outcome.charAt(0).toUpperCase() + meeting.outcome.slice(1)}
                  {meeting.keyTakeaways && meeting.keyTakeaways.length > 0 && (
                    <span className="ml-2">• {meeting.keyTakeaways.length} key takeaways</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {maxItems && displayMeetings.length > maxItems && (
        <div className="p-3 border-t border-gray-200 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View all {displayMeetings.length} meetings
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;
