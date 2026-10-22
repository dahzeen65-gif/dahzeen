// ====== STORAGE KEY FOR REPORTS REGISTRY ======
const REPORTS_STORAGE_KEY = 'mrt_portal_filed_reports';

// ====== INITIALIZE WORKSPACE ON LOAD ======
document.addEventListener("DOMContentLoaded", function() {
    renderReportsTable();

    // Attach listener to your reporting form safely
    const reportForm = document.getElementById("mrtActiveReportingForm");
    if (reportForm) {
        reportForm.addEventListener("submit", handleFormSubmission);
    }
});

// ====== FORM SUBMISSION HANDLER ======
function handleFormSubmission(e) {
    e.preventDefault();
    
    // Determine which report type is currently active in your dashboard view
    const type = document.getElementById("activeFormType").value; 
    let storedReports = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY)) || [];
    
    let reportObject = {
        id: Date.now(), // Unique identifier for tracking and deletion
        dateFiled: new Date().toLocaleDateString(),
        type: type === 'activity' ? 'Lean Activity Report' : 'Incident Report'
    };

    if (type === 'activity') {
        // Captures baseline fields from your Lean Activity Template
        reportObject.title = document.getElementById("actName").value;
        reportObject.filedBy = document.getElementById("actLead").value;
    } else {
        // Captures data fields from your Incident Report Form
        const incType = document.getElementById("incType").value;
        const incLoc = document.getElementById("incLoc").value;
        reportObject.title = `${incType} - ${incLoc}`;
        reportObject.filedBy = document.getElementById("incReporter").value;
    }

    // Optional photo support: read file as DataURL and then save
    const fileInput = document.getElementById('reportPhoto');
    const file = fileInput?.files?.[0];

    function finalizeSave(obj) {
        storedReports.push(obj);
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(storedReports));
        if (typeof hideReportForm === "function") hideReportForm(); 
        document.getElementById("mrtActiveReportingForm").reset();
        renderReportsTable();
        if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            reportObject.photo = loadEvent.target.result;
            finalizeSave(reportObject);
        };
        reader.readAsDataURL(file);
    } else {
        finalizeSave(reportObject);
    }
}

// ====== RENDER REGISTER TABLE ENGINE ======
function renderReportsTable() {
    const tableBody = document.querySelector("#reportsRegistryTable tbody");
    if (!tableBody) return;

    let storedReports = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY)) || [];
    
    if (storedReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#999; padding: 20px;">No documents filed in the local registry.</td></tr>`;
        return;
    }

    // Build the dynamic list with an instant delete action trigger button and optional thumbnail
    tableBody.innerHTML = storedReports.map(r => `
        <tr>
            <td><strong>${r.title}</strong>${r.photo ? `<br><img src="${r.photo}" style="max-width:100px; margin-top:6px;">` : ''}</td>
            <td><span class="badge ${r.type.includes('Incident') ? 'executive' : 'public'}">${r.type}</span></td>
            <td>${r.dateFiled}</td>
            <td>${r.filedBy}</td>
            <td>
                <button class="delete-row-btn" onclick="deleteReportRecord(${r.id})" title="Delete Report">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Preview helper for report photo inputs (used if inputs are present in the DOM)
function previewReportPhoto(event) {
    const input = event.target;
    const file = input?.files?.[0];
    const preview = document.getElementById('reportPhotoPreview');
    if (!preview) return;
    if (!file) {
        preview.src = '';
        preview.style.display = 'none';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ====== RECORD DELETION CORE ======
function deleteReportRecord(id) {
    if (confirm("Are you sure you want to permanently delete this report from your local workspace storage?")) {
        let storedReports = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY)) || [];
        
        // Filter out the selected record item
        storedReports = storedReports.filter(report => report.id !== id);
        
        // Update local memory and re-render dashboard UI
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(storedReports));
        renderReportsTable();
        if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
    }
}

function renderStructuredReport(report) {
  const rawDesc = report.description || "";

  // Gawanya maelezo makubwa kupitia namba za vifungu (Mfano: 1. Introduction, 2. Objectives, n.k.)
  // Hii inatenganisha ripoti kuwa sehemu/sessions huru zenye mpangilio safi

  return `
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      <!-- Report Header -->
      <div class="border-bottom pb-3 mb-4">
        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold mb-2">
          ${report.type || 'Activity Report'}
        </span>
        <h3 class="fw-bold text-dark mb-2">${report.title}</h3>
        <div class="d-flex flex-wrap gap-3 text-muted small">
          <span>📅 <strong>Tarehe:</strong> ${report.date_filed || report.activity_date}</span>
          <span>👥 <strong>Walioshiriki:</strong> ${report.participants || 'N/A'}</span>
          <span>✍️ <strong>Imetolewa na:</strong> ${report.filed_by || 'MRT Team'}</span>
        </div>
      </div>

      <!-- Structured Activity Sessions / Sections -->
      <div class="report-body text-secondary" style="line-height: 1.8; font-size: 0.95rem;">
        ${formatReportIntoSessions(rawDesc)}
      </div>
    </div>
  `;
}

// Kazi inayopangilia maneno kuwa Sessions na Paragrafu nadhifu
function formatReportIntoSessions(text) {
  if (!text) return '<p class="text-muted">Hakuna maelezo ya ziada.</p>';

  // Badilisha vichwa vya habari vya namba kuwa Cards/Sections tofauti
  let formatted = text
    // 1. Introduction
    .replace(/1\.\s+Introduction/gi, '<div class="p-3 mb-3 bg-light rounded-3 border-start border-primary border-4"><h5 class="fw-bold text-dark mb-2">1. Introduction</h5>')
    // 2. Objectives
    .replace(/2\.\s+Objectives/gi, '</div><div class="p-3 mb-3 bg-light rounded-3 border-start border-success border-4"><h5 class="fw-bold text-dark mb-2">2. Objectives of the Training</h5>')
    // 3. Topics Covered
    .replace(/3\.\s+Topics\s+Covered/gi, '</div><div class="p-3 mb-3 bg-light rounded-3 border-start border-warning border-4"><h5 class="fw-bold text-dark mb-2">3. Topics Covered</h5>')
    // 3.1, 3.2, 3.3, 3.4 Subsections
    .replace(/3\.1\s+/g, '<h6 class="fw-bold text-primary mt-3">3.1 ')
    .replace(/3\.2\s+/g, '<h6 class="fw-bold text-primary mt-3">3.2 ')
    .replace(/3\.3\s+/g, '<h6 class="fw-bold text-primary mt-3">3.3 ')
    .replace(/3\.4\s+/g, '<h6 class="fw-bold text-primary mt-3">3.4 ')
    // 4. Key Lessons Learned
    .replace(/4\.\s+Key\s+Lessons/gi, '</div><div class="p-3 mb-3 bg-light rounded-3 border-start border-info border-4"><h5 class="fw-bold text-dark mb-2">4. Key Lessons Learned</h5>')
    // 5. Relevance
    .replace(/5\.\s+Relevance/gi, '</div><div class="p-3 mb-3 bg-light rounded-3 border-start border-danger border-4"><h5 class="fw-bold text-dark mb-2">5. Relevance to MRT</h5>')
    // 6. Recommendations
    .replace(/6\.\s+Recommendations/gi, '</div><div class="p-3 mb-3 bg-light rounded-3 border-start border-secondary border-4"><h5 class="fw-bold text-dark mb-2">6. Recommendations</h5>')
    // Funga div ya mwisho
    + '</div>';

  // Rekebisha alama za bullet (-) ziwe kwenye muonekano wa orodha safi
  formatted = formatted.replace(/-\s+([^\.]+)(\.)?/g, '<li class="mb-1 text-muted">$1$2</li>');

  return formatted;
}
function renderStructuredReport(report) {
  const rawDesc = report.description || "";

  return `
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      <!-- Report Header -->
      <div class="border-bottom pb-3 mb-4">
        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold mb-2">
          ${report.type || 'Activity Report'}
        </span>
        <h3 class="fw-bold text-dark mb-2">${report.title}</h3>
        <div class="d-flex flex-wrap gap-3 text-muted small">
          <span>📅 <strong>Tarehe:</strong> ${report.date_filed || report.activity_date || 'N/A'}</span>
          <span>👥 <strong>Walioshiriki:</strong> ${report.participants || 'N/A'}</span>
          <span>✍️ <strong>Imetolewa na:</strong> ${report.filed_by || 'MRT Team'}</span>
        </div>
      </div>

      <!-- Structured Activity Sessions & Spacing -->
      <div class="report-body text-secondary" style="line-height: 1.8; font-size: 0.95rem;">
        ${formatReportIntoCleanSessions(rawDesc)}
      </div>
    </div>
  `;
}

// Kazi ya kusafisha na kupangilia maandishi ya ripoti kuwa Sessions zilizotulia
function formatReportIntoCleanSessions(text) {
  if (!text) return '<p class="text-muted">Hakuna maelezo ya ziada.</p>';

  // Safisha nafasi zilizopitiliza na uandae muundo
  let formatted = text.trim();

  // 1. Gawanya na kuweka kwenye Cards tofauti kwa kila Sehemu kuu (Mfano: 1., 2., 3., 4., 5., 6.)
  formatted = formatted.replace(
    /(\b[1-9]\.\s+[A-Z][a-zA-Z\s\-]+)/g, 
    '</div><div class="p-3 mb-3 bg-light rounded-4 border-start border-primary border-4 shadow-sm"><h5 class="fw-bold text-dark mb-2">📌 $1</h5>'
  );

  // 2. Weka vichwa vidogo kwa ajili ya vijisehemu (Mfano: 3.1, 3.2, n.k.)
  formatted = formatted.replace(
    /(\b[0-9]+\.[0-9]+\s+[A-Za-z\s\-]+)/g, 
    '<h6 class="fw-bold text-primary mt-3 mb-2">🔹 $1</h6>'
  );

  // 3. Geuza alama za dashi (-) ziwe kwenye muonekano wa orodha safi (bullet points) yenye nafasi
  formatted = formatted.replace(
    /-\s+([^-\n]+)/g, 
    '<li class="text-secondary mb-2" style="list-style-type: disc; margin-left: 20px;">$1</li>'
  );

  // Funga div ya kwanza iliyofunguliwa
  return '<div class="p-3 mb-3 bg-light rounded-4 border-start border-primary border-4 shadow-sm">' + formatted + '</div>';
}

function renderStructuredReport(report) {
  const rawDesc = report.description || "";

  return `
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      <!-- Report Header -->
      <div class="border-bottom pb-3 mb-4">
        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold mb-2">
          ${report.type || 'Activity Report'}
        </span>
        <h3 class="fw-bold text-dark mb-2">${report.title}</h3>
        <div class="d-flex flex-wrap gap-3 text-muted small">
          <span>📅 <strong>Tarehe:</strong> ${report.date_filed || report.activity_date || 'N/A'}</span>
          <span>👥 <strong>Walioshiriki:</strong> ${report.participants || 'N/A'}</span>
          <span>✍️ <strong>Imetolewa na:</strong> ${report.filed_by || 'MRT Team'}</span>
        </div>
      </div>

      <!-- Structured Activity Sessions & Spacing -->
      <div class="report-body text-secondary">
        ${formatReportIntoCleanSessions(rawDesc)}
      </div>
    </div>
  `;
}

function formatReportIntoCleanSessions(text) {
  if (!text) return '<p class="text-muted">Hakuna maelezo ya ziada.</p>';

  let cleanText = text.replace(/^Description:\s*/i, '').trim();

  // 1. Weka alama za kipekee kwenye vichwa vikuu ili kuzuia kugongana na namba za ndani
  let formatted = cleanText
    .replace(/1\.\s+Introduction/g, '---SECTION_1---')
    .replace(/2\.\s+Objectives(?:\s+of\s+the\s+Training)?/g, '---SECTION_2---')
    .replace(/3\.\s+Topics\s+Covered/g, '---SECTION_3---')
    .replace(/4\.\s+Key\s+Lessons(?:\s+Learned)?/g, '---SECTION_4---')
    .replace(/5\.\s+Relevance(?:\s+to[^\.]+?)?(?=\s+6\.|$)/g, '---SECTION_5---')
    .replace(/6\.\s+Recommendations/g, '---SECTION_6---');

  let parts = formatted.split('---SECTION_');
  let html = '';

  let titles = {
    '1': '1. Introduction',
    '2': '2. Objectives of the Training',
    '3': '3. Topics Covered',
    '4': '4. Key Lessons Learned',
    '5': '5. Relevance to Miritini Response Team',
    '6': '6. Recommendations'
  };

  let colors = {
    '1': 'border-primary',
    '2': 'border-success',
    '3': 'border-warning',
    '4': 'border-info',
    '5': 'border-danger',
    '6': 'border-secondary'
  };

  parts.forEach(part => {
    if (!part.trim()) return;
    let sectionNum = part.charAt(0);
    let sectionContent = part.substring(2).trim();

    // 2. Safisha vijisehemu (3.1, 3.2, n.k.) na uweke alama za bullet kwa usahihi
    sectionContent = sectionContent
      .replace(/(3\.[1-4]\s+[A-Za-z\s]+)/g, '<br><strong class="text-primary mt-2 d-inline-block">$1</strong>')
      .replace(/-\s+/g, '<br>&bull; ');

    if (titles[sectionNum]) {
      html += `
        <div class="p-3 mb-3 bg-light rounded-4 border-start ${colors[sectionNum]} border-4 shadow-sm">
          <h5 class="fw-bold text-dark mb-2">📌 ${titles[sectionNum]}</h5>
          <p class="text-secondary mb-0" style="line-height: 1.8; white-space: pre-line;">${sectionContent}</p>
        </div>
      `;
    } else {
      html += `<p class="text-secondary" style="line-height: 1.8;">${part}</p>`;
    }
  });

  return html || `<p class="text-secondary" style="line-height: 1.8;">${cleanText}</p>`;
}