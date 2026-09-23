import { db } from '../db/database.js';
import { AuditLog, User } from '../db/types.js';

interface LogOptions {
  actor?: User;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  status?: 'SUCCESS' | 'FAILURE';
}

export function logAudit(options: LogOptions): AuditLog {
  const log: AuditLog = {
    id: 'audit_' + Math.random().toString(36).substring(2, 11),
    actorId: options.actor?.id,
    actorEmail: options.actor?.email,
    actorRole: options.actor?.role,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    details: options.details,
    ipAddress: options.ipAddress || 'internal',
    status: options.status || 'SUCCESS',
    timestamp: new Date().toISOString()
  };

  db.insertAuditLog(log);
  return log;
}
