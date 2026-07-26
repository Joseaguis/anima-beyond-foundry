export interface ItemTabProps {
  system: Record<string, any>;
  isEditable: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
}

export interface ItemTabDef {
  id: string;
  labelKey: string;
  component: React.FC<ItemTabProps>;
}
