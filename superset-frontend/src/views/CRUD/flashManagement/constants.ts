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