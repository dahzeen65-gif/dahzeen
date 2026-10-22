// ====== STORAGE KEY FOR REPORTS REGISTRY ======
const REPORTS_STORAGE_KEY = 'mrt_portal_filed_reports';

function escapeReportHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

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
            <td><strong>${escapeReportHtml(r.title)}</strong></td>
            <td><span class="badge ${String(r.type || '').includes('Incident') ? 'executive' : 'public'}">${escapeReportHtml(r.type)}</span></td>
            <td>${escapeReportHtml(r.dateFiled)}</td>
            <td>${escapeReportHtml(r.filedBy)}</td>
            <td>
                <button class="action-btn-purple" data-report-view="${escapeReportHtml(r.id)}" title="Read Report">
                    <i class="fas fa-book-open"></i>
                </button>
                <button class="delete-row-btn" data-report-delete="${escapeReportHtml(r.id)}" title="Delete Report">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tableBody.querySelectorAll('[data-report-view]').forEach(button => {
        button.addEventListener('click', () => viewStructuredReport(button.dataset.reportView));
    });
    tableBody.querySelectorAll('[data-report-delete]').forEach(button => {
        button.addEventListener('click', () => deleteReportRecord(button.dataset.reportDelete));
    });
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
        storedReports = storedReports.filter(report => String(report.id) !== String(id));
        
        // Update local memory and re-render dashboard UI
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(storedReports));
        renderReportsTable();
        if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
    }
}

function renderStructuredReport(report) {
    const activityTitle = report.activity_name || report.title || 'Activity Report';
    const dateFiled = report.date_filed || report.dateFiled || 'N/A';
    const filedBy = report.filed_by || report.filedBy || 'MRT Team';
    const metadata = [
        ['Activity name', activityTitle],
        ['Date of activity', report.activity_date || report.actDate || dateFiled],
        ['Duration (hours)', report.duration],
        ['Facilitation methods used', report.facilitation_methods],
        ['Activity facilitators (titles)', report.facilitators || filedBy],
        ['Topics covered', report.topics_covered],
        ['Commodities distributed', report.commodities_distributed],
        ['Male reached', report.male_reached],
        ['Female reached', report.female_reached],
        ['Total people reached', report.total_reached],
        ['Reach remarks', report.remarks],
        ['Total activity expenditure (KES)', report.expenditure || report.budget]
    ];

    return `
        <article class="report-preview">
            <header class="report-preview-header">
                <p>${escapeReportHtml(report.type || 'Activity Report')}</p>
                <h2>${escapeReportHtml(activityTitle)}</h2>
                <div>Date filed: ${escapeReportHtml(dateFiled)} · Filed by: ${escapeReportHtml(filedBy)}</div>
            </header>
            <h3>Official activity metadata</h3>
            <div class="report-preview-table"><table><tbody>
                ${metadata.map(([label, value]) => `<tr><th>${escapeReportHtml(label)}</th><td>${escapeReportHtml(value || 'Not provided')}</td></tr>`).join('')}
            </tbody></table></div>
            <h3>Activity proceedings</h3>
            <div class="report-preview-sessions">${formatReportIntoCleanSessions(report.description)}</div>
        </article>
    `;
}

function formatReportIntoCleanSessions(text) {
    const cleanText = String(text || '').replace(/^Description:\s*/i, '').trim();
    if (!cleanText) return '<p>No additional details provided.</p>';

    const headings = {
        1: /^Introduction$/i,
        2: /^Objectives(?:\s+of\s+the\s+Training)?$/i,
        3: /^Topics\s+Covered$/i,
        4: /^Key\s+Lessons(?:\s+Learned)?$/i,
        5: /^Relevance(?:\s+to\s+Miritini\s+Response\s+Team|\s+to\s+MRT)?$/i,
        6: /^Recommendations$/i
    };
    const titles = {
        1: '1. Introduction',
        2: '2. Objectives',
        3: '3. Topics Covered',
        4: '4. Key Lessons Learned',
        5: '5. Relevance to Miritini Response Team',
        6: '6. Recommendations'
    };
    const sections = [];
    let current = { title: 'Report details', lines: [] };

    cleanText.split(/\r?\n/).forEach(line => {
        const match = line.trim().match(/^([1-6])\.\s+(.+)$/);
        const number = match ? Number(match[1]) : 0;
        if (match && headings[number].test(match[2].trim())) {
            if (current.lines.length || current.title !== 'Report details') sections.push(current);
            current = { title: titles[number], lines: [] };
        } else {
            current.lines.push(line);
        }
    });
    sections.push(current);

    return sections.map(section => {
        const lines = [];
        let bullets = [];
        const flushBullets = () => {
            if (!bullets.length) return;
            lines.push(`<ul>${bullets.map(item => `<li>${escapeReportHtml(item)}</li>`).join('')}</ul>`);
            bullets = [];
        };

        section.lines.forEach(line => {
            const value = line.trim();
            if (!value) {
                flushBullets();
                return;
            }
            const bullet = value.match(/^[-•]\s+(.+)$/);
            const subsection = value.match(/^(3\.[1-4])\s+(.+)$/);
            if (bullet) bullets.push(bullet[1]);
            else {
                flushBullets();
                lines.push(subsection
                    ? `<h4>${escapeReportHtml(`${subsection[1]} ${subsection[2]}`)}</h4>`
                    : `<p>${escapeReportHtml(value)}</p>`);
            }
        });
        flushBullets();

        return `<section class="report-session"><h3>${escapeReportHtml(section.title)}</h3>${lines.join('') || '<p>No details provided.</p>'}</section>`;
    }).join('');
}

function viewStructuredReport(id) {
    const report = (JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY)) || [])
        .find(item => String(item.id) === String(id));
    if (!report) {
        alert('Report record not found.');
        return;
    }

    const dialog = document.createElement('dialog');
    dialog.className = 'report-preview-dialog';
    dialog.innerHTML = `
        <style>
            .report-preview-dialog { width: min(900px, calc(100% - 24px)); max-height: 90vh; padding: 24px; border: 0; border-radius: 14px; box-shadow: 0 16px 48px #0003; color: #30283a; }
            .report-preview-dialog::backdrop { background: #17121dbb; }
            .report-preview-dialog button { float: right; border: 0; border-radius: 7px; padding: 8px 12px; color: #fff; background: #5c2d91; cursor: pointer; }
            .report-preview-header { margin: 20px 0; padding-bottom: 16px; border-bottom: 1px solid #ddd; }
            .report-preview-header p { color: #5c2d91; font-weight: 700; }
            .report-preview-table { overflow-x: auto; }
            .report-preview-table table { width: 100%; border-collapse: collapse; }
            .report-preview-table th, .report-preview-table td { padding: 9px; border: 1px solid #ddd; text-align: left; vertical-align: top; }
            .report-preview-table th { width: 35%; background: #f6f3f8; }
            .report-session { margin: 12px 0; padding: 14px; border: 1px solid #e7e1ed; border-left: 4px solid #7950a1; border-radius: 8px; }
            .report-session h3 { margin-top: 0; color: #4a2673; }
            .report-session h4 { color: #5c2d91; }
            .report-session p { white-space: pre-wrap; }
        </style>
        <button type="button" data-report-close>Close</button>
        ${renderStructuredReport(report)}
    `;
    dialog.querySelector('[data-report-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
}