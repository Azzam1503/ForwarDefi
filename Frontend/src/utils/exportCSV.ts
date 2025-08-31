// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers: string[] = Object.keys(data[0]);
  const csvRows: string[] = [];

  csvRows.push(headers.join(","));
  data.forEach((row) => {
    const values = headers.map((h) => JSON.stringify(row[h] ?? ""));
    csvRows.push(values.join(","));
  });

  const csvString: string = csvRows.join("\n");
  const blob: Blob = new Blob([csvString], { type: "text/csv" });
  const url: string = window.URL.createObjectURL(blob);

  const a: HTMLAnchorElement = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
