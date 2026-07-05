import * as XLSX from "xlsx";

const HEADER_ALIASES = {
  companyName: ["companyname", "company", "company name", "organization", "org"],
  careerUrl: [
    "careerurl",
    "career url",
    "url",
    "careers url",
    "careers page",
    "career page",
    "career portal",
    "careers portal",
    "link",
  ],
  name: ["name", "display name", "source name", "label"],
  scraperType: ["scrapertype", "scraper type", "type", "platform"],
};

const normalizeHeader = (value = "") =>
  String(value).trim().toLowerCase().replace(/\s+/g, " ");

const mapHeaders = (headers = []) => {
  const mapping = {};

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
      if (aliases.includes(normalized)) {
        mapping[field] = index;
      }
    });
  });

  return mapping;
};

const getCell = (row, index) => {
  if (index === undefined) return "";
  const value = row[index];
  return value === undefined || value === null ? "" : String(value).trim();
};

export const parseCareerSourcesSpreadsheet = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (!rows.length) {
    throw new Error("The uploaded file is empty");
  }

  const headerRow = rows[0].map((cell) => String(cell || ""));
  const mapping = mapHeaders(headerRow);

  if (mapping.companyName === undefined || mapping.careerUrl === undefined) {
    throw new Error(
      "Spreadsheet must include companyName and careerUrl columns"
    );
  }

  const companies = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const companyName = getCell(row, mapping.companyName);
    const careerUrl = getCell(row, mapping.careerUrl);

    if (!companyName && !careerUrl) continue;

    if (!companyName || !careerUrl) {
      throw new Error(`Row ${i + 1} is missing companyName or careerUrl`);
    }

    companies.push({
      companyName,
      careerUrl,
      name: getCell(row, mapping.name) || `${companyName} Careers`,
      scraperType: getCell(row, mapping.scraperType) || "",
    });
  }

  if (!companies.length) {
    throw new Error("No company rows found in the uploaded file");
  }

  return companies;
};
