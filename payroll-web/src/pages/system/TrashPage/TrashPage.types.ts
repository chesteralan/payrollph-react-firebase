export interface TrashItem {
  id: string;
  collection: string;
  collectionLabel: string;
  name: string;
  deletedAt: Date | null;
  rawDeletedAt: unknown;
}

export interface TrashCollectionDef {
  key: string;
  label: string;
  nameField: string;
}
