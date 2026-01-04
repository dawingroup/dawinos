/**
 * Shared Hooks
 * Common React hooks used across all modules
 */

export { useAuth, type AuthState, type UseAuthReturn } from './useAuth';
export { 
  useDocument, 
  useCollection, 
  useFirestoreMutation,
  type UseDocumentReturn,
  type UseCollectionReturn
} from './useFirestore';
export { useOnlineStatus } from './useOnlineStatus';
