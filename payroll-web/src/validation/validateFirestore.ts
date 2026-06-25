import { z } from "zod";
import { collection, doc, getDoc, getDocs, query, type Query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import type { CollectionName } from "../services/firestore";
import { COLLECTION_SCHEMAS, type ValidationFailure } from "./schemas";

// ─── Collection-to-schema mapping ────────────────────────────────────
const SCHEMA_MAP: Partial<Record<CollectionName, z.ZodTypeAny>> = {
  payroll: COLLECTION_SCHEMAS.payroll,
  payroll_employees: COLLECTION_SCHEMAS.payroll_employees,
  employees: COLLECTION_SCHEMAS.employees,
  calendar: COLLECTION_SCHEMAS.calendar,
};

/**
 * Whether a collection has a registered Zod schema for runtime validation.
 */
export function hasSchema(collectionName: CollectionName): boolean {
  return collectionName in SCHEMA_MAP;
}

/**
 * Validate a single document against its registered Zod schema.
 * Returns the validated data or throws a structured ValidationFailure.
 */
function validateDoc<T>(
  collectionName: CollectionName,
  id: string,
  data: Record<string, unknown>,
): T {
  const schema = SCHEMA_MAP[collectionName];
  if (!schema) return data as T; // no schema registered — passthrough

  const result = schema.safeParse(data);
  if (!result.success) {
    const failure: ValidationFailure = {
      collection: collectionName,
      documentId: id,
      errors: result.error,
    };
    // Log details for debugging
    console.error(
      `[Validation] ${collectionName}/${id} schema mismatch:`,
      result.error.flatten(),
    );
    throw failure;
  }
  return result.data as T;
}

/**
 * Get a document by ID with runtime Zod validation.
 * If the collection has no registered schema, acts like getById (passthrough).
 * Throws a ValidationFailure on mismatch — caller should catch and surface.
 */
export async function getByIdValidated<T>(
  collectionName: CollectionName,
  id: string,
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = { id: docSnap.id, ...docSnap.data() } as Record<string, unknown>;
  return validateDoc<T>(collectionName, id, data);
}

/**
 * Get all documents from a collection with runtime Zod validation.
 * Skips documents that fail validation (logs the failure but continues).
 * Returns only valid documents.
 */
export async function getAllValidated<T>(
  collectionName: CollectionName,
  filters?: Array<{
    field: string;
    op: "==" | "!=" | ">" | "<" | ">=" | "<=" | "array-contains";
    value: unknown;
  }>,
): Promise<T[]> {
  let q: Query = collection(db, collectionName);
  const queryConstraints = [];

  if (filters) {
    for (const f of filters) {
      queryConstraints.push(where(f.field, f.op, f.value));
    }
  }

  if (queryConstraints.length > 0) {
    q = query(q, ...queryConstraints);
  }

  const snapshot = await getDocs(q);
  const results: T[] = [];

  for (const snap of snapshot.docs) {
    const data = { id: snap.id, ...snap.data() } as Record<string, unknown>;
    try {
      const valid = validateDoc<T>(collectionName, snap.id, data);
      results.push(valid);
    } catch (e) {
      // Log and skip invalid documents — don't crash the whole list
      const failure = e as ValidationFailure;
      console.warn(
        `[Validation] Skipping ${collectionName}/${snap.id}:`,
        failure.errors.flatten(),
      );
    }
  }

  return results;
}

/**
 * Try to parse a document, returning null on failure instead of throwing.
 */
export function tryParseDoc<T>(
  schema: z.ZodType<T>,
  _id: string,
  data: Record<string, unknown>,
): { data: T } | { error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data as T };
  return { error: result.error };
}
