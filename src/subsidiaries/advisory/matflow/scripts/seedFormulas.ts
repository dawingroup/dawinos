/**
 * Formula Seeding Script
 * Run this once to populate the global formula database
 */

import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp,
  getDocs,
  query,
  limit 
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import { FORMULA_SEED_DATA, MATERIAL_RATES_SEED } from '../data/formulas-seed';

const FORMULAS_COLLECTION = 'matflow/data/formulas';
const RATES_COLLECTION = 'matflow/data/material_rates';

export async function seedFormulas(): Promise<{ 
  formulasAdded: number; 
  ratesAdded: number;
  skipped: boolean;
}> {
  // Check if already seeded
  const existingFormulas = await getDocs(
    query(collection(db, FORMULAS_COLLECTION), limit(1))
  );
  
  if (!existingFormulas.empty) {
    console.log('Formulas already seeded, skipping...');
    return { formulasAdded: 0, ratesAdded: 0, skipped: true };
  }
  
  const batch = writeBatch(db);
  let formulasAdded = 0;
  let ratesAdded = 0;
  
  // Seed formulas
  for (const formula of FORMULA_SEED_DATA) {
    const docRef = doc(collection(db, FORMULAS_COLLECTION));
    batch.set(docRef, {
      ...formula,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    formulasAdded++;
  }
  
  // Seed material rates
  for (const rate of MATERIAL_RATES_SEED) {
    const docRef = doc(collection(db, RATES_COLLECTION));
    batch.set(docRef, {
      ...rate,
      id: docRef.id,
      isActive: true,
      validFrom: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    ratesAdded++;
  }
  
  await batch.commit();
  
  console.log(`Seeded ${formulasAdded} formulas and ${ratesAdded} material rates`);
  return { formulasAdded, ratesAdded, skipped: false };
}

// Seed roles
export async function seedRoles(): Promise<number> {
  const ROLES_COLLECTION = 'matflow/data/roles';
  
  const existingRoles = await getDocs(
    query(collection(db, ROLES_COLLECTION), limit(1))
  );
  
  if (!existingRoles.empty) {
    console.log('Roles already seeded, skipping...');
    return 0;
  }
  
  const batch = writeBatch(db);
  
  const roles = [
    {
      id: 'quantity_surveyor',
      name: 'Quantity Surveyor',
      description: 'Full BOQ access, formula management, and approvals',
      capabilities: [
        'boq:view', 'boq:create', 'boq:edit', 'boq:delete', 'boq:approve', 'boq:import',
        'procurement:view', 'procurement:create', 'procurement:edit',
        'project:view', 'project:edit',
        'formula:view', 'formula:manage',
        'reports:view', 'reports:export',
      ],
      isSystem: true,
    },
    {
      id: 'site_engineer',
      name: 'Site Engineer',
      description: 'Procurement logging and BOQ viewing',
      capabilities: [
        'boq:view',
        'procurement:view', 'procurement:create', 'procurement:edit',
        'project:view',
        'formula:view',
        'reports:view',
      ],
      isSystem: true,
    },
    {
      id: 'project_manager',
      name: 'Project Manager',
      description: 'Read access, approvals, and dashboard viewing',
      capabilities: [
        'boq:view', 'boq:approve',
        'procurement:view',
        'project:view', 'project:edit',
        'formula:view',
        'reports:view', 'reports:export',
      ],
      isSystem: true,
    },
  ];
  
  for (const role of roles) {
    const docRef = doc(db, ROLES_COLLECTION, role.id);
    batch.set(docRef, {
      ...role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(`Seeded ${roles.length} roles`);
  return roles.length;
}
