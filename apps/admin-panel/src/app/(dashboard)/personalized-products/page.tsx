import PermissionGate from '@/components/auth/PermissionGate';
import ProductsView from '@/features/products/products-view';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageEnhaLakProducts">
      <ProductsView />
    </PermissionGate>
  );
}
