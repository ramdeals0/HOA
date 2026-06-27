export function escapeCsvValue(value: string | number | null | undefined): string {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function rowsToCsv<T extends Record<string, string | number | null | undefined>>(
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>,
): string {
  const headerLine = columns.map((column) => escapeCsvValue(column.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}
