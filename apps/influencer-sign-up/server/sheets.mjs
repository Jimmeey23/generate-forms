import { google } from 'googleapis';

let authClient;
// An OAuth refresh token for a real Google account is preferred: service accounts have no Drive
// storage of their own, so with one GOOGLE_SHEETS_FOLDER_ID must point at a shared-drive folder.
function googleAuth() {
  if (authClient !== undefined) return authClient;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_SERVICE_ACCOUNT_JSON } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    authClient = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    authClient.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  } else if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    authClient = new google.auth.GoogleAuth({ credentials: JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON), scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'] });
  } else authClient = null;
  return authClient;
}
export const sheetsConfigured = () => Boolean(googleAuth());

const LEADING_COLUMNS = [{ id: '_submittedAt', label: 'Submitted At (IST)' }, { id: '_submissionId', label: 'Submission ID' }];
const TRAILING_COLUMNS = [
  { id: '_momenceLead', label: 'Momence Lead' }, { id: '_momenceSignup', label: 'Momence Signup' },
  { id: '_utmSource', label: 'UTM Source' }, { id: '_utmCampaign', label: 'UTM Campaign' }, { id: '_utmChannel', label: 'UTM Channel' },
  { id: '_utmMedium', label: 'UTM Medium' }, { id: '_referrer', label: 'Referrer' }, { id: '_other', label: 'Other Responses' },
];

// Creates a publicly viewable spreadsheet named after the event, with one column per form field.
export async function createFormSheet(title, fields) {
  const auth = googleAuth();
  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });
  const folder = process.env.GOOGLE_SHEETS_FOLDER_ID;
  const { data: file } = await drive.files.create({ requestBody: { name: String(title || 'Physique 57 Signups').slice(0, 200), mimeType: 'application/vnd.google-apps.spreadsheet', ...(folder ? { parents: [folder] } : {}) }, fields: 'id', supportsAllDrives: true });
  const fieldColumns = (Array.isArray(fields) ? fields : []).filter((field) => field?.id).map((field) => ({ id: field.id, label: String(field.label || field.id), type: field.type || '' }));
  const columns = [...LEADING_COLUMNS, ...fieldColumns, ...TRAILING_COLUMNS];
  await sheets.spreadsheets.values.update({ spreadsheetId: file.id, range: 'A1', valueInputOption: 'RAW', requestBody: { values: [columns.map((column) => column.label)] } });
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: file.id, requestBody: { requests: [
    { updateSheetProperties: { properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat.bold' } },
  ] } });
  await drive.permissions.create({ fileId: file.id, requestBody: { type: 'anyone', role: 'reader' }, supportsAllDrives: true });
  return { sheetId: file.id, sheetUrl: `https://docs.google.com/spreadsheets/d/${file.id}/edit`, sheetColumns: columns };
}

function cellValue(value, type) {
  if (type === 'signature') return value ? 'Signed' : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
}
// Values are written RAW so a guest typing "=..." cannot inject a formula.
export async function appendSubmissionRow({ sheetId, sheetColumns }, submission) {
  const { responses, meta } = submission;
  const known = new Set(sheetColumns.map((column) => column.id));
  const other = Object.fromEntries(Object.entries(responses).filter(([key, value]) => !known.has(key) && !/signature/i.test(key) && value !== '' && value != null));
  const values = { ...meta, _other: Object.keys(other).length ? JSON.stringify(other) : '' };
  const row = sheetColumns.map((column) => column.id.startsWith('_') ? String(values[column.id] ?? '') : cellValue(responses[column.id], column.type));
  const sheets = google.sheets({ version: 'v4', auth: googleAuth() });
  await sheets.spreadsheets.values.append({ spreadsheetId: sheetId, range: 'A1', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values: [row] } });
}
