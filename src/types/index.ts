import type {
  Organization,
  Reservation,
  ReservationTable,
  Table,
  DiningArea,
} from "@/generated/prisma"

export type {
  Organization,
  OrganizationMember,
  OrganizationSettings,
  Subscription,
  DiningArea,
  Table,
  Reservation,
  ReservationTable,
  ReservationAuditLog,
  OrgRole,
  SubscriptionPlan,
  SubscriptionStatus,
  TableShape,
  ReservationStatus,
  ReservationSource,
} from "@/generated/prisma"

export type Module =
  | "reservations:basic"
  | "reservations:all_sources"
  | "table_plan:view"
  | "table_plan:drag_drop"
  | "views:list"
  | "views:timeslot"
  | "views:calendar"
  | "reminders:email"
  | "widget:embeddable"
  | "analytics"
  | "multi_location"
  | "api:access"

export type ReservationWithTables = Reservation & {
  tables: (ReservationTable & { table: Table })[]
}

export type TableWithReservations = Table & {
  reservations: (ReservationTable & { reservation: Reservation })[]
}

export type DiningAreaWithTables = DiningArea & {
  tables: TableWithReservations[]
}
