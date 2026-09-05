'use client';

import { ResourceFormHost } from '@eng-mohamedelsayed/admin-forms/resource';
import {
  ResourceBulkActionBar,
  ResourceCreate,
  ResourceDataView,
  ResourceDensityMenu,
  ResourceExport,
  ResourceImport,
  ResourcePage,
  ResourcePageHeader,
  ResourcePagination,
  ResourceSearch,
  ResourceToolbar,
  ResourceToolbarActions,
} from '@eng-mohamedelsayed/admin-ui/components/resource';
import type { ProductsQueryResult } from '@/actions/products/list-products.action';
import { productResource } from './resource/product-resource';

export interface ProductsViewProps {
  initialData?: ProductsQueryResult | undefined;
}

export function ProductsView({ initialData }: ProductsViewProps) {
  return (
    <ResourcePage resource={productResource} {...(initialData ? { initialData } : {})}>
      <ResourcePageHeader />

      <ResourceToolbar>
        <div className="flex flex-1 items-center min-w-0">
          <ResourceSearch />
        </div>

        <ResourceToolbarActions>
          <ResourceDensityMenu />
          <ResourceImport />
          <ResourceExport />
          <ResourceCreate />
        </ResourceToolbarActions>
      </ResourceToolbar>

      <ResourceDataView />
      <ResourcePagination />
      <ResourceBulkActionBar />
      <ResourceFormHost resource={productResource} />
    </ResourcePage>
  );
}

export default ProductsView;
