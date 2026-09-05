export { cn } from "./lib/utils";

// Official shadcn UI Primitives Installed via CLI
export * from "./components/ui/accordion";
export * from "./components/ui/alert";
export * from "./components/ui/alert-dialog";
export * from "./components/ui/aspect-ratio";
export * from "./components/ui/avatar";
export * from "./components/ui/badge";
export * from "./components/ui/breadcrumb";
export * from "./components/ui/button";
export * from "./components/ui/button-group";
export * from "./components/ui/calendar";
export * from "./components/ui/card";
export * from "./components/ui/carousel";
export * from "./components/ui/chart";
export * from "./components/ui/checkbox";
export * from "./components/ui/collapsible";
export * from "./components/ui/combobox";
export * from "./components/ui/command";
export * from "./components/ui/context-menu";
export * from "./components/ui/dialog";
export * from "./components/ui/drawer";
export * from "./components/ui/dropdown-menu";
export * from "./components/ui/empty";
export * from "./components/ui/field";
export * from "./components/ui/hover-card";
export * from "./components/ui/input";
export * from "./components/ui/input-group";
export * from "./components/ui/input-otp";
export * from "./components/ui/item";
export * from "./components/ui/kbd";
export * from "./components/ui/label";
export * from "./components/ui/menubar";
export * from "./components/ui/navigation-menu";
export * from "./components/ui/pagination";
export * from "./components/ui/popover";
export * from "./components/ui/progress";
export * from "./components/ui/radio-group";
export * from "./components/ui/resizable";
export * from "./components/ui/scroll-area";
export * from "./components/ui/select";
export * from "./components/ui/separator";
export * from "./components/ui/sheet";
export * from "./components/ui/sidebar";
export * from "./components/ui/skeleton";
export * from "./components/ui/slider";
export * from "./components/ui/spinner";
export * from "./components/ui/switch";
export * from "./components/ui/table";
export * from "./components/ui/tabs";
export * from "./components/ui/textarea";
export * from "./components/ui/toggle";
export * from "./components/ui/toggle-group";
export * from "./components/ui/tooltip";

// Feedback states & components
export * from "./components/feedback/error-state";
export * from "./components/feedback/empty-state";
export * from "./components/feedback/loading-state";
export * from "./components/feedback/status-badge";
export * from "./components/feedback/status-switch";
export * from "./components/feedback/unauthorized-state";
export * from "./components/feedback/resource-error-state";

// Provider-agnostic media contracts and presentation
export * from "./components/media";

// Reusable TanStack DataTable primitives
export * from "./components/data-table";
export * from "./components/resource";
export * from "./components/calendar";
export * from "./data-view";
export {
  Filters,
  createFilter,
  type Filter,
  type FilterFieldConfig,
  type FilterOperator,
  type FilterContextValue,
  type FilterI18nConfig,
  type FiltersProps,
} from "./components/reui/filters";

// Notification Center (shared presentational only — no domain/API logic)
export * from "./components/notifications";
