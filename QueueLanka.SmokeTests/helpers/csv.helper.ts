// QueueLanka.SmokeTests/helpers/csv.helper.ts

export function stripBom(text: string): string {
  if (!text) {
    return text;
  }

  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function getCsvHeaders(responseBody: string): string[] {
  const parsed = parseCsvBody(responseBody);
  return parsed.length > 0 ? parsed[0] : [];
}

export function parseCsvResponse(responseBody: string): Array<Record<string, string>> {
  const parsed = parseCsvBody(responseBody);
  if (parsed.length === 0) {
    return [];
  }

  const headers = parsed[0];
  const rows = parsed.slice(1);

  return rows
    .filter((row) => !(row.length === 1 && row[0].trim() === ""))
    .map((row) => {
      const record: Record<string, string> = {};

      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });

      return record;
    });
}

export function getCsvSummaryRow(rows: Array<Record<string, string>>): Record<string, string> | undefined {
  if (rows.length === 0) {
    return undefined;
  }

  return rows[rows.length - 1];
}

function parseCsvBody(responseBody: string): string[][] {
  const text = stripBom(responseBody);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (index + 1 < text.length && text[index + 1] === '"') {
          currentField += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      currentField = "";
      rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (inQuotes) {
    throw new Error("Invalid CSV format: unmatched quote");
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}
