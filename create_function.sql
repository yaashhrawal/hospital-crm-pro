CREATE OR REPLACE FUNCTION get_patients_in_date_range(start_date text, end_date text)
RETURNS SETOF patients AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM patients
  WHERE
    (created_at >= start_date::timestamptz AND created_at <= end_date::timestamptz) OR
    (date_of_entry >= start_date::timestamptz AND date_of_entry <= end_date::timestamptz);
END;
$$ LANGUAGE plpgsql;