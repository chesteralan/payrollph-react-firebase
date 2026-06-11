declare module "html2canvas" {
  const html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module "jspdf" {
  class jsPDF {
    constructor(options?: { orientation?: string; unit?: string; format?: string });
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void;
    save(filename: string): void;
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
  }
  export default jsPDF;
}

declare module "@axe-core/react" {
  const axe: (react: unknown, reactDOM: unknown, timeout?: number) => void;
  export default axe;
}

declare module "firebase-admin/app" {
  import { app, credential } from "firebase-admin";
  export function initializeApp(options?: {
    credential?: credential.Credential;
    projectId?: string;
    storageBucket?: string;
  }): app.App;
  export function cert(serviceAccount: Record<string, unknown>): credential.Credential;
  export function getApps(): app.App[];
}

declare module "firebase-admin/firestore" {
  import { firestore } from "firebase-admin";
  export type Firestore = firestore.Firestore;
  export type CollectionReference = firestore.CollectionReference;
  export type DocumentReference = firestore.DocumentReference;
  export type DocumentData = firestore.DocumentData;
  export type Timestamp = firestore.Timestamp;
  export type FieldValue = firestore.FieldValue;
  export function getFirestore(app?: app.App): Firestore;
  export const Timestamp: typeof firestore.Timestamp;
  export const FieldValue: typeof firestore.FieldValue;
  export const Filter: typeof firestore.Filter;
}
