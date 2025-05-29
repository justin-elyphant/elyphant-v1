
export interface EventCreateData {
  date: string;
  date_type: string;
  visibility: string;
  is_recurring?: boolean;
  recurring_type?: string;
  series_id?: string;
  end_date?: string;
  max_occurrences?: number;
  occurrence_number?: number;
}

export interface EventUpdateData extends Partial<EventCreateData> {
  id: string;
  is_modified?: boolean;
}

export interface SeriesUpdateData {
  series_id: string;
  updates: Partial<EventCreateData>;
  apply_to_future_only?: boolean;
}
