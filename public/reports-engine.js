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

