import type { DataViewHierarchyUpdate } from '../../data-view/contracts';

export interface ResourceActions<TData, TCreateInput, TUpdateInput> {
  create(values: TCreateInput): Promise<unknown>;
  update(record: TData, values: TUpdateInput): Promise<unknown>;
  delete(record: TData): Promise<unknown>;
  deleteMany(records: TData[]): Promise<unknown>;
  deleteManyByIds?(ids: string[], loadedRows: TData[]): Promise<unknown>;
  reorder(input: DataViewHierarchyUpdate): Promise<unknown>;
  import(file: File): Promise<unknown>;
}
