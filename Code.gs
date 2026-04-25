// ============================================================
// Google Apps Script — Questionnaire OhMyCake10
// L-BOOST DigitalWeb
// ============================================================

// ——— CONFIGURATION ———
const OWNER_EMAIL    = 'laalililoubna41@gmail.com';
const NOTIFY_EMAIL   = 'l-boost@hotmail.com';
const SHEET_NAME     = 'Questionnaires OhMyCake10';
const DRIVE_FOLDER   = 'Questionnaires OhMyCake10';
const CLIENT_NAME    = 'OhMyCake10';

// ——— Labels lisibles pour le mail ———
const LABELS = {
  clientele:    'Clientele cible',
  clients_base: 'Base clients existante',
  reseaux:      'Reseaux sociaux',
  abonnes:      'Nombre abonnes',
  mode:         'Mode du compte',
  frequence:    'Frequence de publication',
  contenu:      'Aisance creation contenu',
  photo:        'Capacite photo/video',
  temps:        'Temps par semaine',
  canva:        'Utilisation Canva',
  budget:       'Budget global',
  invest:       'Type investissement',
  print:        'Budget supports physiques',
  paiement:     'Mode de reglement',
  besoins:      'Besoins',
  besoin_autre: 'Autre besoin',
  ambiance:     'Ambiance souhaitee',
  inspirations: 'Inspirations',
  non_voulu:    'Ce qui est exclu',
  libre:        'Message libre'
};

// ——— Ordre des colonnes dans le Sheet ———
const FIELD_ORDER = [
  'clientele','clients_base','reseaux','abonnes','mode','frequence',
  'contenu','photo','temps','canva',
  'budget','invest','print','paiement',
  'besoins','besoin_autre',
  'ambiance','inspirations','non_voulu','libre'
];

// ============================================================
// CORS — preflight OPTIONS
// ============================================================
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================
// POST handler
// ============================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 1) Ajouter au Google Sheet
    addToSheet(data);

    // 2) Sauvegarder le PDF dans Drive
    var pdfUrl = savePdfToDrive(data.pdfBase64, data._meta);

    // 3) Envoyer le mail avec PJ (Gmail)
    sendEmail(data, pdfUrl);

    // 4) Notification Hotmail avec lien PDF
    sendNotification(data, pdfUrl);

    return jsonResponse({ success: true, message: 'Donnees recues avec succes' });

  } catch (err) {
    Logger.log('ERREUR doPost: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// Reponse JSON avec CORS headers
// ============================================================
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 1) GOOGLE SHEET
// ============================================================
function addToSheet(data) {
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheets()[0];

  // Construire la ligne
  var row = [new Date()]; // colonne Date
  FIELD_ORDER.forEach(function(key) {
    var val = data[key];
    if (Array.isArray(val)) val = val.join(', ');
    row.push(val || '');
  });

  sheet.appendRow(row);
}

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  // Creer le spreadsheet
  var ss = SpreadsheetApp.create(SHEET_NAME);

  // Deplacer dans le dossier
  var folder = getOrCreateFolder();
  folder.addFile(DriveApp.getFileById(ss.getId()));
  DriveApp.getRootFolder().removeFile(DriveApp.getFileById(ss.getId()));

  // En-tetes
  var headers = ['Date'];
  FIELD_ORDER.forEach(function(key) {
    headers.push(LABELS[key] || key);
  });
  var sheet = ss.getSheets()[0];
  sheet.setName('Reponses');
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#C9A96E')
    .setFontColor('#0B0B0F');
  sheet.setFrozenRows(1);

  // Largeurs
  sheet.setColumnWidth(1, 160);
  for (var i = 2; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 180);
  }

  return ss;
}

// ============================================================
// 2) SAUVEGARDE PDF DANS DRIVE
// ============================================================
function savePdfToDrive(base64, meta) {
  if (!base64) return null;

  var folder = getOrCreateFolder();
  var date = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd_HH-mm');
  var fileName = 'Questionnaire_' + CLIENT_NAME + '_' + date + '.pdf';

  var decoded = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(decoded, 'application/pdf', fileName);
  var file = folder.createFile(blob);

  return file.getUrl();
}

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRIVE_FOLDER);
}

// ============================================================
// 3) ENVOI GMAIL AVEC PIECE JOINTE
// ============================================================
function sendEmail(data, pdfUrl) {
  var date = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy a HH:mm');

  // Construire le corps HTML
  var html = buildEmailHtml(data, date, pdfUrl);

  // Piece jointe PDF
  var attachments = [];
  if (data.pdfBase64) {
    var decoded = Utilities.base64Decode(data.pdfBase64);
    var blob = Utilities.newBlob(decoded, 'application/pdf',
      'Questionnaire_' + CLIENT_NAME + '_' + Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd') + '.pdf');
    attachments.push(blob);
  }

  GmailApp.sendEmail(OWNER_EMAIL,
    '🧁 Nouveau questionnaire — ' + CLIENT_NAME,
    'Nouvelles reponses recues le ' + date + '. Ouvre le mail en HTML pour voir le detail.',
    {
      htmlBody: html,
      attachments: attachments,
      name: 'L-BOOST DigitalWeb'
    }
  );
}

// ============================================================
// 4) NOTIFICATION HOTMAIL — lien PDF + resume
// ============================================================
function sendNotification(data, pdfUrl) {
  var date = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy a HH:mm');

  var besoins = data.besoins;
  if (Array.isArray(besoins)) besoins = besoins.join(', ');
  if (!besoins) besoins = '—';

  var budget = data.budget || '—';

  var driveBtn = pdfUrl
    ? '<a href="' + pdfUrl + '" style="display:inline-block;background:#C9A96E;color:#0B0B0F;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin:20px 0;">Ouvrir le PDF sur Drive</a>'
    : '<p style="color:#6B6B7E;font-size:12px;">(Aucun PDF genere)</p>';

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:0;background:#0B0B0F;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;padding:40px 16px;">'
    + '<tr><td align="center">'
    + '<table width="520" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:12px;border:1px solid #1A1A24;">'

    // Header
    + '<tr><td style="padding:28px 28px 20px 28px;border-bottom:1px solid #1A1A24;">'
    + '<span style="display:inline-block;background:#C9A96E;color:#0B0B0F;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">LB</span>'
    + ' <span style="color:#F5F4F0;font-size:14px;font-weight:600;margin-left:6px;">L-BOOST DigitalWeb</span>'
    + '</td></tr>'

    // Body
    + '<tr><td style="padding:28px;text-align:center;">'
    + '<p style="font-size:28px;color:#F5F4F0;font-weight:300;margin:0 0 6px 0;">Nouveau questionnaire</p>'
    + '<p style="font-size:18px;color:#C9A96E;font-style:italic;margin:0 0 24px 0;">' + CLIENT_NAME + '</p>'
    + '<table width="100%" style="margin:0 0 20px 0;text-align:left;">'
    + '<tr><td style="padding:8px 0;border-bottom:1px solid #1A1A24;"><span style="font-size:10px;color:#6B6B7E;text-transform:uppercase;letter-spacing:1px;">Date</span><br/><span style="font-size:13px;color:#E8D5B0;">' + date + '</span></td></tr>'
    + '<tr><td style="padding:8px 0;border-bottom:1px solid #1A1A24;"><span style="font-size:10px;color:#6B6B7E;text-transform:uppercase;letter-spacing:1px;">Budget</span><br/><span style="font-size:13px;color:#E8D5B0;">' + escapeHtml(budget) + '</span></td></tr>'
    + '<tr><td style="padding:8px 0;border-bottom:1px solid #1A1A24;"><span style="font-size:10px;color:#6B6B7E;text-transform:uppercase;letter-spacing:1px;">Besoins</span><br/><span style="font-size:13px;color:#E8D5B0;">' + escapeHtml(besoins) + '</span></td></tr>'
    + '</table>'
    + driveBtn
    + '</td></tr>'

    // Footer
    + '<tr><td style="padding:16px 28px;background:#0B0B0F;border-top:1px solid #1A1A24;text-align:center;">'
    + '<p style="margin:0;font-size:10px;color:#22222E;">Le detail complet est dans ton Gmail · lboost-digitalweb.fr</p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  GmailApp.sendEmail(NOTIFY_EMAIL,
    '🧁 Nouveau questionnaire ' + CLIENT_NAME + ' — PDF disponible',
    'Nouveau questionnaire recu le ' + date + '. Lien PDF : ' + (pdfUrl || 'non disponible'),
    {
      htmlBody: html,
      name: 'L-BOOST DigitalWeb'
    }
  );
}

// ============================================================
// Template HTML du mail
// ============================================================
function buildEmailHtml(data, date, pdfUrl) {
  var sections = [
    { title: '01 · Clientele cible', fields: ['clientele', 'clients_base'] },
    { title: '02 · Presence reseaux', fields: ['reseaux', 'abonnes', 'mode', 'frequence'] },
    { title: '03 · Competences & temps', fields: ['contenu', 'photo', 'temps', 'canva'] },
    { title: '04 · Budget', fields: ['budget', 'invest', 'print', 'paiement'] },
    { title: '05 · Besoins', fields: ['besoins', 'besoin_autre'] },
    { title: '06 · Inspirations & ambiance', fields: ['ambiance', 'inspirations', 'non_voulu', 'libre'] }
  ];

  var body = '';
  sections.forEach(function(sec) {
    body += '<tr><td style="padding:24px 0 8px 0;font-size:11px;font-weight:600;letter-spacing:2px;color:#C9A96E;text-transform:uppercase;border-bottom:1px solid #1A1A24;">' + sec.title + '</td></tr>';
    sec.fields.forEach(function(key) {
      var val = data[key];
      if (Array.isArray(val)) val = val.join(', ');
      if (!val) val = '—';
      body += '<tr>'
        + '<td style="padding:10px 0 10px 0;border-bottom:1px solid #111118;">'
        + '<span style="display:block;font-size:10px;color:#6B6B7E;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">' + (LABELS[key] || key) + '</span>'
        + '<span style="font-size:13px;color:#E8D5B0;line-height:1.6;">' + escapeHtml(val) + '</span>'
        + '</td></tr>';
    });
  });

  var driveLink = pdfUrl
    ? '<a href="' + pdfUrl + '" style="color:#C9A96E;text-decoration:underline;">Ouvrir le PDF sur Drive</a>'
    : '';

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:0;background:#0B0B0F;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;padding:32px 16px;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:12px;border:1px solid #1A1A24;overflow:hidden;">'

    // Header
    + '<tr><td style="background:linear-gradient(135deg,#1A1A24,#22222E);padding:32px 28px;border-bottom:1px solid #C9A96E30;">'
    + '<table width="100%"><tr>'
    + '<td><span style="display:inline-block;background:#C9A96E;color:#0B0B0F;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">LB</span>'
    + ' <span style="color:#F5F4F0;font-size:14px;font-weight:600;margin-left:8px;">L-BOOST DigitalWeb</span></td>'
    + '<td align="right"><span style="color:#6B6B7E;font-size:11px;">' + date + '</span></td>'
    + '</tr></table>'
    + '<p style="margin:20px 0 0 0;font-size:24px;color:#F5F4F0;font-weight:300;">Nouveau questionnaire <span style="color:#C9A96E;font-style:italic;">' + CLIENT_NAME + '</span></p>'
    + '</td></tr>'

    // Body
    + '<tr><td style="padding:8px 28px 28px 28px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0">' + body + '</table>'
    + '</td></tr>'

    // Footer
    + '<tr><td style="padding:20px 28px;background:#0B0B0F;border-top:1px solid #1A1A24;text-align:center;">'
    + '<p style="margin:0 0 8px 0;font-size:11px;color:#6B6B7E;">' + driveLink + '</p>'
    + '<p style="margin:0;font-size:10px;color:#22222E;">L-BOOST DigitalWeb · lboost-digitalweb.fr</p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';
}

// ============================================================
// Utilitaire
// ============================================================
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
