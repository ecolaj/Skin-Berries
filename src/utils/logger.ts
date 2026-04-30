import { supabase } from '../lib/supabase';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PAGE_VIEW' 
  | 'CREATE_RECORD' 
  | 'UPDATE_RECORD' 
  | 'DELETE_RECORD' 
  | 'EXPORT_DATA';

export const logAction = async (
  action: AuditAction, 
  details?: any, 
  entityType?: string, 
  entityId?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('audit_logs').insert([{
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: {
        ...details,
        path: window.location.pathname,
        userAgent: navigator.userAgent
      }
    }]);
  } catch (error) {
    console.error('Error logging action:', error);
  }
};
