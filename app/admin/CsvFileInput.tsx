"use client";

export default function CsvFileInput() {
  return <input className="input" name="file" type="file" accept=".csv,text/csv" required
    onChange={event => {
      const field = event.currentTarget;
      const file = field.files?.[0];
      field.setCustomValidity(file && file.size > 4 * 1024 * 1024
        ? "Le CSV dépasse 4 Mo. Divisez-le en plusieurs fichiers avec la même ligne d’en-tête."
        : "");
      field.reportValidity();
    }} />;
}
