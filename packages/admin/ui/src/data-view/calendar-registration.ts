import { Calendar } from "lucide-react";
import type { ViewRegistration } from "./registry";
import { ResourceCalendarView } from "../components/resource/resource-calendar-view";

export const calendarViewRegistration: ViewRegistration = {
  type: "calendar",
  label: "Calendar",
  icon: Calendar,
  capabilities: {
    pagination: false,
    selection: false,
    bulkActions: false,
    reordering: false,
    sorting: false,
    search: true,
    filtering: true,
    dateRange: true,
  },
  renderer: ResourceCalendarView,
};
