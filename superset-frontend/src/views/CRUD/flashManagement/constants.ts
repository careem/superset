import { FilterDropdown } from "./types";

export const FLASH_TYPES: FilterDropdown[] = [
  { label: 'One Time', value: 'One Time' },
  { label: 'Short Term', value: 'Short Term' },
  { label: 'Long Term', value: 'Long Term' },
]

export const SCHEDULE_TYPE : FilterDropdown[] =  [
  { label: 'Daily', value: '@daily' },
  { label: 'Weekly', value: '@weekly' },
  { label: 'Monthly', value: '@monthly' },
]

export const DATABASES : FilterDropdown[] =  [
  { label: 'Pinot Flashes', value: 'Pinot Flashes' },
]

export const FLASH_STATUS: FilterDropdown[] = [
  { label: 'New', value: 'NEW' },
  { label: 'In Progress', value: 'IN PROGRESS' },
  { label: 'Materialized', value: 'MATERIALIZED' },
  { label: 'Stale', value: 'STALE' },
  { label: 'Deleted', value: 'DELETED' },

]