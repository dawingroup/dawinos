/**
 * Firestore Security Rules Tests - DawinOS v2.0
 * Run with: firebase emulators:exec 'npm test'
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'dawinos-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ============================================
// HR Employee Rules
// ============================================

describe('HR Employee Rules', () => {
  test('HR can read all employees', async () => {
    const hrUser = testEnv.authenticatedContext('hr-user', {
      role: 'hr_admin',
      subsidiaryId: 'finishes',
    });
    
    // Create test employee
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/employees/emp-001'), {
        personalInfo: { firstName: 'John', lastName: 'Doe' },
        employment: { subsidiaryId: 'finishes' },
        status: 'active',
        userId: 'other-user',
      });
    });
    
    const db = hrUser.firestore();
    await assertSucceeds(getDoc(doc(db, 'hr/employees/emp-001')));
  });
  
  test('Employee can read own record', async () => {
    const empUser = testEnv.authenticatedContext('emp-user', {
      role: 'staff',
      subsidiaryId: 'finishes',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/employees/emp-001'), {
        personalInfo: { firstName: 'John', lastName: 'Doe' },
        employment: { subsidiaryId: 'finishes' },
        status: 'active',
        userId: 'emp-user',
      });
    });
    
    const db = empUser.firestore();
    await assertSucceeds(getDoc(doc(db, 'hr/employees/emp-001')));
  });
  
  test('Employee cannot read other employee records', async () => {
    const empUser = testEnv.authenticatedContext('emp-user', {
      role: 'staff',
      subsidiaryId: 'finishes',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/employees/emp-002'), {
        personalInfo: { firstName: 'Jane', lastName: 'Doe' },
        employment: { subsidiaryId: 'finishes' },
        status: 'active',
        userId: 'other-user',
      });
    });
    
    const db = empUser.firestore();
    await assertFails(getDoc(doc(db, 'hr/employees/emp-002')));
  });
  
  test('Regular employee cannot create employee records', async () => {
    const empUser = testEnv.authenticatedContext('emp-user', {
      role: 'staff',
      subsidiaryId: 'finishes',
    });
    
    const db = empUser.firestore();
    await assertFails(setDoc(doc(db, 'hr/employees/new-emp'), {
      personalInfo: { firstName: 'New', lastName: 'Employee' },
      employment: { subsidiaryId: 'finishes' },
      status: 'active',
    }));
  });
  
  test('HR can create employee records', async () => {
    const hrUser = testEnv.authenticatedContext('hr-user', {
      role: 'hr_admin',
      subsidiaryId: 'finishes',
    });
    
    const db = hrUser.firestore();
    await assertSucceeds(setDoc(doc(db, 'hr/employees/new-emp'), {
      personalInfo: { firstName: 'New', lastName: 'Employee' },
      employment: { subsidiaryId: 'finishes' },
      status: 'active',
    }));
  });
});

// ============================================
// Smart Task Rules
// ============================================

describe('Smart Task Rules', () => {
  test('User can read tasks assigned to them', async () => {
    const user = testEnv.authenticatedContext('task-user', {
      role: 'staff',
      subsidiaryId: 'advisory',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'shared_ops/smart_tasks/task-001'), {
        title: 'Test Task',
        assignedTo: 'task-user',
        status: 'pending',
        createdBy: 'other-user',
        createdAt: new Date(),
      });
    });
    
    const db = user.firestore();
    await assertSucceeds(getDoc(doc(db, 'shared_ops/smart_tasks/task-001')));
  });
  
  test('User can read tasks they created', async () => {
    const user = testEnv.authenticatedContext('task-user', {
      role: 'staff',
      subsidiaryId: 'advisory',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'shared_ops/smart_tasks/task-002'), {
        title: 'Test Task',
        assignedTo: 'other-user',
        status: 'pending',
        createdBy: 'task-user',
        createdAt: new Date(),
      });
    });
    
    const db = user.firestore();
    await assertSucceeds(getDoc(doc(db, 'shared_ops/smart_tasks/task-002')));
  });
  
  test('User cannot read unrelated tasks', async () => {
    const user = testEnv.authenticatedContext('task-user', {
      role: 'staff',
      subsidiaryId: 'advisory',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'shared_ops/smart_tasks/task-003'), {
        title: 'Other Task',
        assignedTo: 'other-user',
        status: 'pending',
        createdBy: 'another-user',
        createdAt: new Date(),
      });
    });
    
    const db = user.firestore();
    await assertFails(getDoc(doc(db, 'shared_ops/smart_tasks/task-003')));
  });
  
  test('User can create tasks', async () => {
    const user = testEnv.authenticatedContext('task-user', {
      role: 'staff',
      subsidiaryId: 'advisory',
    });
    
    const db = user.firestore();
    await assertSucceeds(setDoc(doc(db, 'shared_ops/smart_tasks/new-task'), {
      title: 'New Task',
      assignedTo: 'task-user',
      status: 'pending',
      createdBy: 'task-user',
      createdAt: new Date(),
    }));
  });
});

// ============================================
// Executive Module Rules
// ============================================

describe('Executive Module Rules', () => {
  test('Executive can read strategy documents', async () => {
    const execUser = testEnv.authenticatedContext('exec-user', {
      role: 'executive',
      subsidiaryId: 'finishes',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'executive/strategy/documents/doc-001'), {
        title: 'Strategy Doc',
        content: 'Content here',
        createdBy: 'other-exec',
        createdAt: new Date(),
      });
    });
    
    const db = execUser.firestore();
    await assertSucceeds(getDoc(doc(db, 'executive/strategy/documents/doc-001')));
  });
  
  test('Non-executive cannot read strategy documents', async () => {
    const staffUser = testEnv.authenticatedContext('staff-user', {
      role: 'staff',
      subsidiaryId: 'finishes',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'executive/strategy/documents/doc-001'), {
        title: 'Strategy Doc',
        content: 'Confidential',
        createdBy: 'exec-user',
        createdAt: new Date(),
      });
    });
    
    const db = staffUser.firestore();
    await assertFails(getDoc(doc(db, 'executive/strategy/documents/doc-001')));
  });
  
  test('Executive can create strategy documents', async () => {
    const execUser = testEnv.authenticatedContext('exec-user', {
      role: 'executive',
      subsidiaryId: 'finishes',
    });
    
    const db = execUser.firestore();
    await assertSucceeds(setDoc(doc(db, 'executive/strategy/documents/new-doc'), {
      title: 'New Strategy',
      content: 'Content',
      createdBy: 'exec-user',
      createdAt: new Date(),
    }));
  });
});

// ============================================
// Payroll Rules
// ============================================

describe('Payroll Rules', () => {
  test('Payroll records can never be deleted', async () => {
    const adminUser = testEnv.authenticatedContext('admin-user', {
      role: 'platform_admin',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/payroll_batches/batch-001'), {
        period: { month: 1, year: 2026 },
        status: 'completed',
      });
    });
    
    const db = adminUser.firestore();
    // Even admin cannot delete payroll records
    await assertFails(deleteDoc(doc(db, 'hr/payroll_batches/batch-001')));
  });
  
  test('HR can read payroll batches', async () => {
    const hrUser = testEnv.authenticatedContext('hr-user', {
      role: 'hr_admin',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/payroll_batches/batch-001'), {
        period: { month: 1, year: 2026 },
        status: 'completed',
      });
    });
    
    const db = hrUser.firestore();
    await assertSucceeds(getDoc(doc(db, 'hr/payroll_batches/batch-001')));
  });
  
  test('Regular staff cannot read payroll batches', async () => {
    const staffUser = testEnv.authenticatedContext('staff-user', {
      role: 'staff',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/payroll_batches/batch-001'), {
        period: { month: 1, year: 2026 },
        status: 'completed',
      });
    });
    
    const db = staffUser.firestore();
    await assertFails(getDoc(doc(db, 'hr/payroll_batches/batch-001')));
  });
});

// ============================================
// Audit Log Rules
// ============================================

describe('Audit Log Rules', () => {
  test('Audit logs cannot be updated', async () => {
    const adminUser = testEnv.authenticatedContext('admin-user', {
      role: 'platform_admin',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'audit_logs/log-001'), {
        action: 'user_login',
        userId: 'user-123',
        timestamp: new Date(),
      });
    });
    
    const db = adminUser.firestore();
    await assertFails(setDoc(doc(db, 'audit_logs/log-001'), {
      action: 'modified',
      userId: 'user-123',
      timestamp: new Date(),
    }));
  });
  
  test('Audit logs cannot be deleted', async () => {
    const adminUser = testEnv.authenticatedContext('admin-user', {
      role: 'platform_admin',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'audit_logs/log-001'), {
        action: 'user_login',
        userId: 'user-123',
        timestamp: new Date(),
      });
    });
    
    const db = adminUser.firestore();
    await assertFails(deleteDoc(doc(db, 'audit_logs/log-001')));
  });
  
  test('Authenticated users can create audit logs', async () => {
    const user = testEnv.authenticatedContext('any-user', {
      role: 'staff',
    });
    
    const db = user.firestore();
    await assertSucceeds(setDoc(doc(db, 'audit_logs/new-log'), {
      action: 'user_action',
      userId: 'any-user',
      timestamp: new Date(),
    }));
  });
});

// ============================================
// Leave Request Rules
// ============================================

describe('Leave Request Rules', () => {
  test('Employee can create their own leave request', async () => {
    const empUser = testEnv.authenticatedContext('emp-user', {
      role: 'staff',
    });
    
    const db = empUser.firestore();
    await assertSucceeds(setDoc(doc(db, 'hr/leave_requests/req-001'), {
      employeeId: 'emp-user',
      leaveType: 'annual',
      startDate: new Date(),
      endDate: new Date(),
      status: 'pending',
    }));
  });
  
  test('Employee cannot create leave request for others', async () => {
    const empUser = testEnv.authenticatedContext('emp-user', {
      role: 'staff',
    });
    
    const db = empUser.firestore();
    await assertFails(setDoc(doc(db, 'hr/leave_requests/req-002'), {
      employeeId: 'other-user',
      leaveType: 'annual',
      startDate: new Date(),
      endDate: new Date(),
      status: 'pending',
    }));
  });
  
  test('Employee can read their own leave requests', async () => {
    const empUser = testEnv.authenticatedContext('emp-user', {
      role: 'staff',
    });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'hr/leave_requests/req-001'), {
        employeeId: 'emp-user',
        leaveType: 'annual',
        startDate: new Date(),
        endDate: new Date(),
        status: 'pending',
      });
    });
    
    const db = empUser.firestore();
    await assertSucceeds(getDoc(doc(db, 'hr/leave_requests/req-001')));
  });
});
