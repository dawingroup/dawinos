// ============================================================================
// CONTACT LIST
// DawinOS v2.0 - Capital Hub Module
// Displays and manages investor contacts
// ============================================================================

import React from 'react';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Linkedin,
  Star,
  Crown,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { InvestorContact } from '../../types/investor.types';
import {
  CONTACT_ROLE_LABELS,
  COMMUNICATION_TYPE_LABELS,
  ContactRole,
  CommunicationType,
} from '../../constants/investor.constants';

interface ContactListProps {
  contacts: InvestorContact[];
  onAddContact?: () => void;
  onEditContact?: (contact: InvestorContact) => void;
  onDeleteContact?: (contactId: string) => void;
  onContactClick?: (contact: InvestorContact, method: CommunicationType) => void;
}

const formatDate = (timestamp: { toDate: () => Date } | undefined): string => {
  if (!timestamp) return 'Never';
  return timestamp.toDate().toLocaleDateString();
};

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onContactClick,
}) => {
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (a.isDecisionMaker && !b.isDecisionMaker) return -1;
    if (!a.isDecisionMaker && b.isDecisionMaker) return 1;
    return 0;
  });

  const getInfluenceColor = (influence: 'high' | 'medium' | 'low') => {
    switch (influence) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-gray-100 text-gray-600';
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No contacts added</p>
          <p className="text-sm text-gray-500 mt-1">
            Add key contacts for this investor
          </p>
          {onAddContact && (
            <button
              onClick={onAddContact}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Add Contact
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">
          Contacts ({contacts.length})
        </h3>
        {onAddContact && (
          <button
            onClick={onAddContact}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {sortedContacts.map((contact) => (
          <div key={contact.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              {/* Contact Info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.isPrimary && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                    {contact.isDecisionMaker && (
                      <Crown className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{contact.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                      {CONTACT_ROLE_LABELS[contact.role as ContactRole]}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${getInfluenceColor(contact.influence)}`}>
                      {contact.influence} influence
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onEditContact && (
                  <button
                    onClick={() => onEditContact(contact)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onDeleteContact && !contact.isPrimary && (
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Contact Methods */}
            <div className="flex flex-wrap gap-2 mt-3 ml-13">
              <button
                onClick={() => onContactClick?.(contact, 'email')}
                className="flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{contact.email}</span>
              </button>
              
              {contact.phone && (
                <button
                  onClick={() => onContactClick?.(contact, 'call')}
                  className="flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{contact.phone}</span>
                </button>
              )}
              
              {contact.whatsApp && (
                <button
                  onClick={() => onContactClick?.(contact, 'whatsapp')}
                  className="flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}
              
              {contact.linkedIn && (
                <button
                  onClick={() => onContactClick?.(contact, 'linkedin')}
                  className="flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </button>
              )}
            </div>

            {/* Preferred Contact & Last Contact */}
            <div className="flex items-center gap-4 mt-2 ml-13 text-xs text-gray-500">
              <span>
                Preferred: {COMMUNICATION_TYPE_LABELS[contact.preferredContactMethod as CommunicationType]}
              </span>
              <span>•</span>
              <span>Last contact: {formatDate(contact.lastContactDate)}</span>
              <span>•</span>
              <span>{contact.totalInteractions} interactions</span>
            </div>

            {/* Notes */}
            {contact.notes && (
              <p className="mt-2 ml-13 text-sm text-gray-600 line-clamp-2">
                {contact.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactList;
