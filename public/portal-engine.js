// ====== STORAGE KEYS FOR LOCAL BROWSER SYSTEM ======
const STORAGE_KEYS = {
    sales: 'mrt_portal_sales',
    expenses: 'mrt_portal_expenses',
    events: 'mrt_portal_events',
    gallery: 'mrt_portal_gallery',
    accounts: 'mrt_portal_accounts',
    allowedUsers: 'mrt_portal_allowed_users',
    reports: 'mrt_portal_filed_reports',
    programs: 'mrt_portal_programs'
};

// Document repository keys
STORAGE_KEYS.policies = 'mrt_portal_policies';
STORAGE_KEYS.sops = 'mrt_portal_sops';
STORAGE_KEYS.minutes = 'mrt_portal_minutes';
STORAGE_KEYS.contracts = 'mrt_portal_contracts';
STORAGE_KEYS.templates = 'mrt_portal_templates';
STORAGE_KEYS.memberDocuments = 'mrt_portal_member_documents';

// ====== INITIAL DEMO DATA FOR FIRST-TIME RUNS ======
const defaultSales = [
    { id: 1, item: "MRT Branded T-Shirts", qty: "12", cash: "14400", status: "Completed" },
    { id: 2, item: "Community First-Aid Training", qty: "1 Corp", cash: "25000", status: "Completed" }
];

const defaultExpenses = [
    { id: 1, desc: "Purchase of 50 Tree Seedlings", cat: "Environment", cash: "7500" },
    { id: 2, desc: "Fuel for Emergency Response Vehicle", cat: "Disaster Mgt", cash: "4200" }
];

const defaultEvents = [
    { id: 1, day: 6, title: "Emergency Preparedness Drill", type: "event-orange" },
    { id: 2, day: 13, title: "World Environment Tree Drive", type: "event-green" },
    { id: 3, day: 20, title: "Miritini Market Cleanup", type: "event-purple" }
];

const defaultGallery = [
    { id: 1, title: "Tree Planting Campaign", description: "Environmental conservation activity", category: "Environment", type: "image", src: "images/tree1.jpg" },
    { id: 2, title: "Emergency Training", description: "Preparedness activities", category: "Emergency", type: "image", src: "images/emergency1.jpg" },
    { id: 3, title: "MRT Activity Video", description: "Community action highlights", category: "Videos", type: "video", src: "images/video1.mp4" }
];

const defaultHeroSlides = [
    { src: "images/tree1.jpg" },
    { src: "images/emergency1.jpg" },
    { src: "images/hero1.jpg" }
];

const defaultAccounts = {
    bank: "145200"
};

const defaultAllowedUsers = ["Mbaruk Mbaruk"];

const defaultReports = [];

const defaultPrograms = [];

const defaultPolicies = [];
const defaultSOPs = [];
const defaultMinutes = [];
const defaultContracts = [];
const defaultTemplates = [];
const defaultMemberDocuments = [];

const LOGIN_PASSWORD = "MrTEam001";
const COOKIE_CONSENT_KEY = 'mrt_cookie_consent';

function showCookieConsentBanner() {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(COOKIE_CONSENT_KEY)) return;
    if (document.getElementById('mrt-cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'mrt-cookie-banner';
    banner.style.position = 'fixed';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.bottom = '0';
    banner.style.zIndex = '9999';
    banner.style.background = '#0f172a';
    banner.style.color = '#f8fafc';
    banner.style.boxShadow = '0 -10px 30px rgba(15, 23, 42, 0.25)';
    banner.style.padding = '16px 20px';
    banner.style.borderTop = '1px solid rgba(255,255,255,0.08)';

    banner.innerHTML = `
        <div style="max-width:1180px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
            <div style="flex:1; min-width:260px;">
                <strong style="display:block; font-size:15px; margin-bottom:4px;">Cookie preferences</strong>
                <span style="font-size:13px; color:#cbd5e1; line-height:1.5;">
                    This site uses essential cookies to keep your admin session secure. You can accept or decline non-essential cookies.
                </span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <button id="mrt-cookie-accept" style="background:#22c55e; color:white; border:none; border-radius:8px; padding:10px 16px; font-weight:600; cursor:pointer;">Accept</button>
                <button id="mrt-cookie-decline" style="background:transparent; color:#e2e8f0; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:10px 16px; font-weight:600; cursor:pointer;">Decline</button>
            </div>
        </div>
    `;

    document.body.appendChild(banner);

    const acceptBtn = document.getElementById('mrt-cookie-accept');
    const declineBtn = document.getElementById('mrt-cookie-decline');

    acceptBtn.addEventListener('click', function() {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        banner.remove();
    });

    declineBtn.addEventListener('click', function() {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        banner.remove();
    });
}

// ====== LOAD DATA ENGINE ======
function getPortalData(key, defaultData) {
    const data = localStorage.getItem(key);
    if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
    }
    return JSON.parse(data);
}

// Preview helper for dynamically injected photo input
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

// ====== INITIALIZE WORKSPACE RENDERING ======
function renderDashboard() {
    const sales = getPortalData(STORAGE_KEYS.sales, defaultSales);
    const expenses = getPortalData(STORAGE_KEYS.expenses, defaultExpenses);
    const galleryItems = getPortalData(STORAGE_KEYS.gallery, defaultGallery);
    
    // 1. Render Sales Table
    const salesBody = document.querySelector("#salesTable tbody");
    if (salesBody) {
        salesBody.innerHTML = sales.map(s => `
            <tr>
                <td>${s.item}</td>
                <td>${s.qty}</td>
                <td>KES ${parseInt(s.cash).toLocaleString()}</td>
                <td><span class="badge public">${s.status}</span></td>
                <td><button class="delete-row-btn" onclick="deleteRecord('sales', ${s.id})"><i class="fas fa-trash-alt"></i></button></td>
            </tr>
        `).join('');
    }

    // 2. Render Expenses Table
    const expensesBody = document.querySelector("#expensesTable tbody");
    if (expensesBody) {
        expensesBody.innerHTML = expenses.map(e => `
            <tr>
                <td>${e.desc}</td>
                <td>${e.cat}</td>
                <td class="text-red">- KES ${parseInt(e.cash).toLocaleString()}</td>
                <td><button class="delete-row-btn" onclick="deleteRecord('expenses', ${e.id})"><i class="fas fa-trash-alt"></i></button></td>
            </tr>
        `).join('');
    }

    // 2b. Update expenditure chart based on expenses data
    updateExpenditureChart(expenses);

    // 2c. Render vault account figures if available
    renderVaultAccounts();

    // 2d. Update gallery counter
    const galleryCount = document.getElementById("galleryItemsCount");
    if (galleryCount) galleryCount.innerText = galleryItems.length;

    // 3. Render Live Dynamic Calendar
    generateLiveCalendar();
}

// ====== GENUINE LIVE CALENDAR GENERATOR ======
function generateLiveCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    if (!calendarDays) return;

    const today = new Date();
    const currentDay = today.getDate();
    const events = getPortalData(STORAGE_KEYS.events, defaultEvents);
    
    const paddingDays = 1; // June 2026 starts on Monday
    const totalDays = 30;

    calendarDays.innerHTML = "";

    // Padding grid blocks
    for (let i = 31; i > 31 - paddingDays; i--) {
        calendarDays.innerHTML += `<div class="day empty">${i}</div>`;
    }

    // Interactive Days build
    for (let i = 1; i <= totalDays; i++) {
        let activeClass = "";
        let dayTitle = "";
        
        if (i === currentDay) activeClass = "today";

        // Check if there is an active saved event for this day number
        const dayEvent = events.find(e => parseInt(e.day) === i);
        if (dayEvent) {
            activeClass = dayEvent.type;
            dayTitle = dayEvent.title;
        }

        calendarDays.innerHTML += `<div class="day ${activeClass}" title="${dayTitle}" ${dayEvent ? `onclick="deleteRecord('events', ${dayEvent.id})"` : ''}>${i}</div>`;
    }
}

// ====== DATA RETRIEVAL AND INSERTION ENGINE ======
document.addEventListener("DOMContentLoaded", function() {
    showCookieConsentBanner();

    const sidebar = document.querySelector('.dashboard-sidebar');
    const mainHeader = document.querySelector('.main-header-portal');
    if (sidebar && mainHeader) {
        const existingToggle = document.querySelector('.mobile-sidebar-toggle');
        if (!existingToggle) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'mobile-sidebar-toggle';
            toggle.setAttribute('aria-label', 'Toggle portal menu');
            toggle.setAttribute('title', 'Toggle menu');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
            mainHeader.insertBefore(toggle, mainHeader.firstChild);

            const overlay = document.createElement('div');
            overlay.className = 'mobile-sidebar-overlay';
            document.body.appendChild(overlay);

            toggle.addEventListener('click', function() {
                document.body.classList.toggle('sidebar-open');
            });

            overlay.addEventListener('click', function() {
                document.body.classList.remove('sidebar-open');
            });

            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    document.body.classList.remove('sidebar-open');
                }
            });
        }
    }

    // 1. Bind form submissions safely
    const form = document.getElementById("portalEntryForm");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            const type = document.getElementById("entryType").value;
            const f1 = document.getElementById("field1").value;
            const f2 = document.getElementById("field2").value;
            const f3 = document.getElementById("field3").value;
            
            const timestampId = Date.now();

            if (type === 'sale') {
                let sales = getPortalData(STORAGE_KEYS.sales, defaultSales);
                sales.push({ id: timestampId, item: f1, qty: f2, cash: f3, status: "Completed" });
                localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
            } else if (type === 'expense') {
                let expenses = getPortalData(STORAGE_KEYS.expenses, defaultExpenses);
                expenses.push({ id: timestampId, desc: f1, cat: f2 || "General", cash: f3 });
                localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
            } else if (type === 'event') {
                let events = getPortalData(STORAGE_KEYS.events, defaultEvents);
                events.push({ id: timestampId, day: parseInt(f3), title: f1, type: "event-purple" });
                localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
            }

            closeModal();
            renderDashboard();
        });
    }

    // 2. Map dynamic attribute functions to your buttons safely without crashing
    const saleBtn = document.querySelector(".vault-header .upload-btn-portal[data-purpose='sale']");
    if (saleBtn) saleBtn.setAttribute("onclick", "openModal('sale')");
    
    const expBtn = document.querySelector(".vault-header .upload-btn-portal[data-purpose='expense']");
    if (expBtn) expBtn.setAttribute("onclick", "openModal('expense')");

    const galleryForm = document.getElementById("galleryUploadForm");
    if (galleryForm) {
        galleryForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const mediaType = document.getElementById("media-type").value;
            const caption = document.getElementById("galleryCaption").value.trim();
            const category = document.getElementById("galleryCategory").value;
            const fileInput = document.getElementById("media-file");
            const file = fileInput?.files?.[0];

            if (!caption || !category || !file) {
                alert("Please provide a caption, category, and a media file.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(loadEvent) {
                const src = loadEvent.target.result;
                const gallery = getPortalData(STORAGE_KEYS.gallery, defaultGallery);
                gallery.push({
                    id: Date.now(),
                    title: caption,
                    description: category === "Videos" ? "Video highlight" : caption,
                    category,
                    type: mediaType === "video" ? "video" : "image",
                    src
                });
                localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(gallery));
                renderDashboard();
                fileInput.value = "";
                document.getElementById("galleryCaption").value = "";
                alert("Gallery item uploaded and will appear in the public gallery.");
            };

            reader.readAsDataURL(file);
        });
    }

    const loginForm = document.querySelector(".login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value;
            const message = document.getElementById("loginMessage");

            if (!username || !password) {
                if (message) message.innerText = "Please enter both username and password.";
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    if (message) message.innerText = data.message || 'Invalid credentials or unauthorized user account.';
                    return;
                }

                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Authentication Error:', error);
                if (message) message.innerText = 'Cannot establish secure link to backend authentication server.';
            }
        });
    }

    const galleryButtons = document.querySelectorAll(".gallery-filter-btn");
    if (galleryButtons.length) {
        galleryButtons.forEach(button => {
            button.addEventListener("click", function() {
                galleryButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                renderGalleryPage(button.dataset.category || "All");
            });
        });
        renderGalleryPage();
    }

    if (document.getElementById('heroSlideshow')) {
        renderHeroSlideshow();
    }

    const reportForm = document.getElementById("mrtActiveReportingForm");
    if (reportForm) {
        reportForm.addEventListener("submit", handleReportFormSubmission);
        renderReportsTable();
    }

    const programForm = document.getElementById("programForm");
    if (programForm) {
        programForm.addEventListener("submit", handleProgramFormSubmission);
        renderProgramsTable();
    }

    const editReportForm = document.getElementById("editReportForm");
    if (editReportForm) {
        editReportForm.addEventListener("submit", handleEditReportFormSubmission);
    }

    const editProgramForm = document.getElementById("editProgramForm");
    if (editProgramForm) {
        editProgramForm.addEventListener("submit", handleEditProgramFormSubmission);
    }

    if (document.querySelector("#documentsReportsTable") || document.querySelector("#documentsProgramsTable") || document.getElementById('memberDocumentsTable')) {
        renderDocumentsPage();
        renderMemberDocumentsTable();
    }
    const uploadForm = document.getElementById('documentUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', submitDocumentUploadForm);
    }
    // Attach open modal function to global scope for buttons
    window.openDocumentUploadModal = openDocumentUploadModal;
    window.closeDocumentUploadModal = closeDocumentUploadModal;
    
    // Initialize Dashboard data injection
    renderDashboard();
});

function renderHeroSlideshow() {
    const slideshow = document.getElementById("heroSlideshow");
    if (!slideshow) return;

    const galleryItems = getPortalData(STORAGE_KEYS.gallery, defaultGallery).filter(item => item.type === "image");
    const slides = galleryItems.length ? galleryItems : defaultHeroSlides;

    slideshow.innerHTML = slides.map((item, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" style="background-image:url('${item.src}')"></div>
    `).join('');

    startHeroSlideshow();
}

function startHeroSlideshow() {
    const slides = document.querySelectorAll('#heroSlideshow .slide');
    if (!slides.length) return;
    let currentIndex = 0;

    if (window.heroSlideTimer) {
        clearInterval(window.heroSlideTimer);
    }

    window.heroSlideTimer = setInterval(() => {
        slides[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
    }, 5000);
}

// ====== RECORD DELETION CORE ======
function deleteRecord(storageType, id) {
    if (confirm("Are you sure you want to permanently clear this record from the MRT system registry?")) {
        let key = STORAGE_KEYS[storageType];
        let currentRecords = JSON.parse(localStorage.getItem(key));
        let filteredRecords = currentRecords.filter(item => item.id !== id);
        
        localStorage.setItem(key, JSON.stringify(filteredRecords));
        renderDashboard();
    }
}

// ====== MODAL WINDOW UI INTERACTION CONTROLS ======
function openModal(type) {
    const modal = document.getElementById("entryModal");
    if (!modal) return;
    
    document.getElementById("entryType").value = type;
    document.getElementById("qtyGroup").style.display = "block";
    
    if(type === 'sale') {
        document.getElementById("modalTitle").innerText = "Log New Business Sale";
        document.getElementById("labelField1").innerText = "Item / Service Name";
        document.getElementById("field1").placeholder = "e.g. MRT Branded T-Shirt";
        document.getElementById("field2").placeholder = "e.g. 5";
        document.getElementById("labelField3").innerText = "Total Revenue (KES)";
    } else if(type === 'expense') {
        document.getElementById("modalTitle").innerText = "Log Operational Expense";
        document.getElementById("labelField1").innerText = "Expense Description";
        document.getElementById("field2").placeholder = "e.g. Disaster Mgt";
        document.getElementById("labelField3").innerText = "Amount Spent (KES)";
    } else if(type === 'event') {
        document.getElementById("modalTitle").innerText = "Schedule Operations Event";
        document.getElementById("labelField1").innerText = "Event Name";
        document.getElementById("field1").placeholder = "e.g. Miritini Cleanup Drive";
        document.getElementById("qtyGroup").style.display = "none";
        document.getElementById("labelField3").innerText = "Target Day Number (1-30)";
        document.getElementById("field3").placeholder = "e.g. 28";
    }
    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("entryModal").style.display = "none";
    document.getElementById("portalEntryForm").reset();
}

function openVaultModal() {
    const modal = document.getElementById("vaultPinModal");
    if (!modal) return;
    document.getElementById("vaultPinMessage").innerText = "";
    document.getElementById("vaultPin").value = "";
    modal.style.display = "flex";
}

function closeVaultModal() {
    const modal = document.getElementById("vaultPinModal");
    if (!modal) return;
    modal.style.display = "none";
}

function submitVaultPin() {
    const pinInput = document.getElementById("vaultPin");
    const message = document.getElementById("vaultPinMessage");
    const pin = pinInput?.value.trim();
    const correctPin = "482901";

    if (!pin) {
        message.innerText = "Please enter the vault PIN.";
        return;
    }

    if (pin === correctPin) {
        message.style.color = "#1e7e34";
        message.innerText = "PIN accepted. Vault unlocked.";
        setTimeout(() => {
            closeVaultModal();
            showVaultUnlockedSection();
            renderVaultAccounts();
        }, 500);
    } else {
        message.style.color = "#cc0000";
        message.innerText = "Incorrect PIN. Try again.";
    }
}

function showVaultUnlockedSection() {
    const section = document.getElementById("vaultUnlockedSection");
    if (section) section.style.display = "block";
}

function renderVaultAccounts() {
    const accounts = getPortalData(STORAGE_KEYS.accounts, defaultAccounts);
    const bankValue = document.getElementById("bankValue");
    const bankAccountValue = document.getElementById("bankAccountValue");
    const bankInput = document.getElementById("bankInput");

    const bankText = `KES ${parseInt(accounts.bank).toLocaleString()}`;

    if (bankValue) bankValue.innerText = bankText;
    if (bankAccountValue) bankAccountValue.innerText = bankText;
    if (bankInput) bankInput.value = accounts.bank;
    renderVaultUserList();
}

function renderVaultUserList() {
    const users = getPortalData(STORAGE_KEYS.allowedUsers, defaultAllowedUsers);
    const list = document.getElementById("vaultUserList");
    if (!list) return;

    list.innerHTML = users.map((user, index) => `
        <div class="vault-user-entry">
            <span>${user}</span>
            <button class="remove-user-btn" onclick="removeVaultUser(${index})">Remove</button>
        </div>
    `).join('');
}

function addVaultUser() {
    const input = document.getElementById("vaultUserInput");
    if (!input) return;
    const value = input.value.trim();
    if (!value) return;

    const users = getPortalData(STORAGE_KEYS.allowedUsers, defaultAllowedUsers);
    const exists = users.some(user => user.toLowerCase() === value.toLowerCase());
    if (exists) {
        alert("This username is already authorized.");
        return;
    }

    users.push(value);
    localStorage.setItem(STORAGE_KEYS.allowedUsers, JSON.stringify(users));
    input.value = "";
    renderVaultUserList();
}

function removeVaultUser(index) {
    const users = getPortalData(STORAGE_KEYS.allowedUsers, defaultAllowedUsers);
    if (index < 0 || index >= users.length) return;
    users.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.allowedUsers, JSON.stringify(users));
    renderVaultUserList();
}

function saveVaultAccount(type) {
    const accounts = getPortalData(STORAGE_KEYS.accounts, defaultAccounts);
    const input = document.getElementById(`${type}Input`);
    if (!input) return;
    const value = input.value.replace(/[^0-9]/g, '');
    if (!value) return;

    accounts[type] = value;
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    renderVaultAccounts();
    lockVault();
}

function lockVault() {
    const section = document.getElementById("vaultUnlockedSection");
    if (section) section.style.display = "none";
}

// ====== REPORTS MANAGEMENT ======
function toggleReportForm(type) {
    const container = document.getElementById("reportFormContainer");
    const typeField = document.getElementById("activeFormType");
    const title = document.getElementById("dynamicFormTitle");
    const fieldsDiv = document.getElementById("dynamicFormFields");

    if (!container || !typeField || !fieldsDiv) return;

    typeField.value = type;

    if (type === 'activity') {
        title.innerHTML = '<i class="fas fa-file-alt"></i> Lean Activity Report';
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label for="actName">Activity Name *</label>
                <input type="text" id="actName" placeholder="e.g., Community Cleanup Drive" required>
            </div>
            <div class="form-group">
                <label for="actLead">Activity Lead *</label>
                <input type="text" id="actLead" placeholder="Name of person leading this activity" required>
            </div>
            <div class="form-group">
                <label for="actDate">Activity Date *</label>
                <input type="date" id="actDate" required>
            </div>
            <div class="form-group">
                <label for="actParticipants">Number of Participants</label>
                <input type="number" id="actParticipants" placeholder="e.g., 25" min="0">
            </div>
            <div class="form-group">
                <label for="actDescription">Activity Description & Outcomes</label>
                <textarea id="actDescription" placeholder="Describe the activity, what was accomplished, and key takeaways..." rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="actBudget">Budget Used (KES)</label>
                <input type="number" id="actBudget" placeholder="e.g., 5000" min="0" step="100">
            </div>
            <div class="form-group">
                <label for="reportPhoto">Upload Photo</label>
                <input type="file" id="reportPhoto" accept="image/*" onchange="previewReportPhoto(event)">
                <img id="reportPhotoPreview" src="" alt="Preview" style="max-width:150px; display:none; margin-top:10px; border:1px solid #e1e1e1; padding:4px;">
            </div>
        `;
    } else if (type === 'incident') {
        title.innerHTML = '<i class="fas fa-file-alt"></i> Incident Report';
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label for="incType">Incident Type *</label>
                <select id="incType" required>
                    <option value="">Select incident type...</option>
                    <option value="Security">Security</option>
                    <option value="Health">Health</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incLoc">Location *</label>
                <input type="text" id="incLoc" placeholder="Where did the incident occur?" required>
            </div>
            <div class="form-group">
                <label for="incDate">Date & Time of Incident *</label>
                <input type="datetime-local" id="incDate" required>
            </div>
            <div class="form-group">
                <label for="incReporter">Reporter Name *</label>
                <input type="text" id="incReporter" placeholder="Your name" required>
            </div>
            <div class="form-group">
                <label for="incDescription">Incident Description</label>
                <textarea id="incDescription" placeholder="Detailed description of what happened..." rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="incInjuries">Injuries/Casualties</label>
                <input type="text" id="incInjuries" placeholder="e.g., 2 minor injuries">
            </div>
            <div class="form-group">
                <label for="incDamage">Property Damage</label>
                <input type="text" id="incDamage" placeholder="Description of any damage">
            </div>
            <div class="form-group">
                <label for="incActions">Actions Taken</label>
                <textarea id="incActions" placeholder="What actions were taken in response?" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="incStatus">Status *</label>
                <select id="incStatus" required>
                    <option value="">Select status...</option>
                    <option value="Reported">Reported</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </div>
            <div class="form-group">
                <label for="reportPhoto">Upload Photo</label>
                <input type="file" id="reportPhoto" accept="image/*" onchange="previewReportPhoto(event)">
                <img id="reportPhotoPreview" src="" alt="Preview" style="max-width:150px; display:none; margin-top:10px; border:1px solid #e1e1e1; padding:4px;">
            </div>
        `;
    }

    container.style.display = 'block';
}

function hideReportForm() {
    const container = document.getElementById("reportFormContainer");
    if (container) container.style.display = 'none';
}

function handleReportFormSubmission(e) {
    e.preventDefault();

    const type = document.getElementById("activeFormType").value; 

    let reportObject = {
        id: Date.now(),
        dateFiled: new Date().toLocaleDateString(),
        type: type === 'activity' ? 'Lean Activity Report' : 'Incident Report'
    };

    if (type === 'activity') {
        reportObject.title = document.getElementById("actName")?.value || '';
        reportObject.filedBy = document.getElementById("actLead")?.value || '';
        reportObject.actDate = document.getElementById("actDate")?.value || '';
        reportObject.participants = document.getElementById("actParticipants")?.value || '';
        reportObject.description = document.getElementById("actDescription")?.value || '';
        reportObject.budget = document.getElementById("actBudget")?.value || '';
    } else {
        const incType = document.getElementById("incType")?.value || '';
        const incLoc = document.getElementById("incLoc")?.value || '';
        reportObject.title = `${incType} - ${incLoc}`;
        reportObject.filedBy = document.getElementById("incReporter")?.value || '';
        reportObject.incType = incType;
        reportObject.incLoc = incLoc;
        reportObject.incDate = document.getElementById("incDate")?.value || '';
        reportObject.description = document.getElementById("incDescription")?.value || '';
        reportObject.injuries = document.getElementById("incInjuries")?.value || '';
        reportObject.damage = document.getElementById("incDamage")?.value || '';
        reportObject.actions = document.getElementById("incActions")?.value || '';
        reportObject.status = document.getElementById("incStatus")?.value || '';
    }

    // Handle optional photo file (as DataURL) before saving
    const fileInput = document.getElementById('reportPhoto');
    const file = fileInput?.files?.[0];

    function finalizeSave(obj) {
        const current = getPortalData(STORAGE_KEYS.reports, defaultReports);
        current.push(obj);
        localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(current));
        if (typeof hideReportForm === "function") hideReportForm();
        document.getElementById("mrtActiveReportingForm")?.reset();
        renderReportsTable();
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

function renderReportsTable() {
    const tableBody = document.querySelector("#reportsRegistryTable tbody");
    if (!tableBody) return;

    let storedReports = getPortalData(STORAGE_KEYS.reports, defaultReports);
    
    if (storedReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#999; padding: 20px;">No documents filed in the local registry.</td></tr>`;
        return;
    }

    tableBody.innerHTML = storedReports.map(r => `
        <tr>
            <td><strong>${r.title}</strong>${r.photo ? `<br><img src="${r.photo}" alt="photo" style="max-width:100px; margin-top:6px; border:1px solid #e1e1e1; padding:4px;">` : ''}</td>
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

function deleteReportRecord(id) {
    if (confirm("Are you sure you want to permanently delete this report from your local workspace storage?")) {
        let storedReports = getPortalData(STORAGE_KEYS.reports, defaultReports);
        storedReports = storedReports.filter(report => report.id !== id);
        localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(storedReports));
        renderReportsTable();
        if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
    }
}

function downloadReportsAsJSON() {
    const reports = getPortalData(STORAGE_KEYS.reports, defaultReports);
    const dataStr = JSON.stringify(reports, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MRT_Reports_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function downloadReportsAsCSV() {
    const reports = getPortalData(STORAGE_KEYS.reports, defaultReports);
    if (reports.length === 0) {
        alert('No reports to download.');
        return;
    }

    let csv = 'ID,Date Filed,Type,Title,Filed By,Details\n';
    reports.forEach(r => {
        const details = r.type.includes('Activity') 
            ? `Activity Date: ${r.actDate}, Participants: ${r.participants}, Budget: ${r.budget}`
            : `Type: ${r.incType}, Location: ${r.incLoc}, Status: ${r.status}`;
        const row = [r.id, r.dateFiled, r.type, `"${r.title}"`, r.filedBy, `"${details}"`].join(',');
        csv += row + '\n';
    });

    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MRT_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function printReports() {
    const printWindow = window.open('', '', 'width=900,height=600');
    const reports = getPortalData(STORAGE_KEYS.reports, defaultReports);
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>MRT Reports</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #4CAF50; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .report-detail { margin: 20px 0; padding: 15px; border-left: 4px solid #4CAF50; background: #f9f9f9; }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <h1>MRT Reports Registry</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Date Filed</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Filed By</th>
                    </tr>
                </thead>
                <tbody>
    `;

    reports.forEach(r => {
        htmlContent += `
            <tr>
                <td>${r.dateFiled}</td>
                <td>${r.type}</td>
                <td>${r.title}</td>
                <td>${r.filedBy}</td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
            <h2 style="margin-top: 30px;">Detailed Reports</h2>
    `;

    reports.forEach(r => {
        htmlContent += `<div class="report-detail">`;
        htmlContent += `<h3>${r.title}</h3>`;
        htmlContent += `<p><strong>Type:</strong> ${r.type}</p>`;
        htmlContent += `<p><strong>Date Filed:</strong> ${r.dateFiled}</p>`;
        htmlContent += `<p><strong>Filed By:</strong> ${r.filedBy}</p>`;
        
        if (r.type.includes('Activity')) {
            htmlContent += `<p><strong>Activity Date:</strong> ${r.actDate}</p>`;
            htmlContent += `<p><strong>Participants:</strong> ${r.participants}</p>`;
            htmlContent += `<p><strong>Budget:</strong> KES ${r.budget}</p>`;
            htmlContent += `<p><strong>Description:</strong> ${r.description}</p>`;
        } else {
            htmlContent += `<p><strong>Incident Type:</strong> ${r.incType}</p>`;
            htmlContent += `<p><strong>Location:</strong> ${r.incLoc}</p>`;
            htmlContent += `<p><strong>Date & Time:</strong> ${r.incDate}</p>`;
            htmlContent += `<p><strong>Description:</strong> ${r.description}</p>`;
            htmlContent += `<p><strong>Injuries:</strong> ${r.injuries || 'None reported'}</p>`;
            htmlContent += `<p><strong>Damage:</strong> ${r.damage || 'None reported'}</p>`;
            htmlContent += `<p><strong>Actions Taken:</strong> ${r.actions}</p>`;
            htmlContent += `<p><strong>Status:</strong> ${r.status}</p>`;
        }
        htmlContent += `</div>`;
    });

    htmlContent += `
            <script>
                window.print();
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

function deleteMediaItem(id) {
    if (!confirm('Delete this media item from the site store?')) return;
    let galleryItems = getPortalData(STORAGE_KEYS.gallery, defaultGallery);
    galleryItems = galleryItems.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(galleryItems));
    renderDocumentsMediaStore();
    if (document.querySelector('#galleryGrid')) renderGalleryPage();
}

function renderDocumentsReportsTable() {
    const tableBody = document.querySelector("#documentsReportsTable tbody");
    if (!tableBody) return;

    const storedReports = getPortalData(STORAGE_KEYS.reports, defaultReports);
    if (storedReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding: 20px;">No reports have been filed yet.</td></tr>`;
        return;
    }

    tableBody.innerHTML = storedReports.map(r => `
        <tr>
            <td>${r.dateFiled}</td>
            <td>${r.type}</td>
            <td>${r.title}</td>
            <td>${r.filedBy}</td>
            <td>${r.type.includes('Activity') ? (r.actDate || '-') : (r.incDate || '-')}</td>
            <td>
                <button class="action-btn-purple" onclick="openEditReportForm(${r.id})" title="Edit Report">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderMemberDocumentsTable() {
    const tableBody = document.querySelector("#memberDocumentsTable tbody");
    if (!tableBody) return;

    const documents = getPortalData(STORAGE_KEYS.memberDocuments, defaultMemberDocuments);
    if (!documents.length) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#999; padding: 20px;">No member documents have been submitted yet.</td></tr>`;
        return;
    }

    tableBody.innerHTML = documents.map(doc => `
        <tr>
            <td>${doc.memberName}</td>
            <td>${doc.memberEmail}</td>
            <td>${doc.submittedAt}</td>
            <td>
                <div style="font-size:13px; line-height:1.4;">
                    <strong>ID Card</strong><br>
                    <strong>CV</strong><br>
                    <strong>Certificates</strong><br>
                    <strong>Passport Photo</strong><br>
                    ${doc.files.otherDocs ? '<strong>Other Docs</strong>' : ''}
                </div>
            </td>
            <td>
                <button class="action-btn-purple" onclick="showMemberDocumentDetails(${doc.id})">View Details</button>
                <button class="delete-row-btn" onclick="deleteMemberDocumentEntry(${doc.id})" title="Delete Entry"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
}

function showMemberDocumentDetails(id) {
    const documents = getPortalData(STORAGE_KEYS.memberDocuments, defaultMemberDocuments);
    const doc = documents.find(item => item.id === id);
    if (!doc) return;

    const details = document.getElementById('memberDetailsContent');
    if (!details) return;

    details.innerHTML = `
        <div style="display:grid; gap:16px;">
            <div><strong>Member Name:</strong> ${doc.memberName}</div>
            <div><strong>Email / ID:</strong> ${doc.memberEmail}</div>
            <div><strong>Submitted:</strong> ${doc.submittedAt}</div>
            <div><strong>Notes:</strong> ${doc.notes || 'None'}</div>
            <div><strong>Download Files:</strong></div>
            <div style="display:grid; gap:10px;">
                <a href="${doc.files.idCard.data}" download="${doc.files.idCard.name}" class="download-link"><i class="fas fa-id-card"></i> ID Card</a>
                <a href="${doc.files.cv.data}" download="${doc.files.cv.name}" class="download-link"><i class="fas fa-file-alt"></i> CV</a>
                <a href="${doc.files.certificates.data}" download="${doc.files.certificates.name}" class="download-link"><i class="fas fa-certificate"></i> Certificates</a>
                <a href="${doc.files.passportPhoto.data}" download="${doc.files.passportPhoto.name}" class="download-link"><i class="fas fa-camera"></i> Passport Photo</a>
                ${doc.files.otherDocs ? `<a href="${doc.files.otherDocs.data}" download="${doc.files.otherDocs.name}" class="download-link"><i class="fas fa-file"></i> Other Documents</a>` : ''}
            </div>
        </div>
    `;
    document.getElementById('memberDocumentDetails').style.display = 'block';
}

function closeMemberDetails() {
    const section = document.getElementById('memberDocumentDetails');
    if (section) section.style.display = 'none';
}

function deleteMemberDocumentEntry(id) {
    if (!confirm('Permanently delete this member document bundle?')) return;
    const documents = getPortalData(STORAGE_KEYS.memberDocuments, defaultMemberDocuments).filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.memberDocuments, JSON.stringify(documents));
    renderMemberDocumentsTable();
    closeMemberDetails();
}

function openEditReportForm(id) {
    const report = getPortalData(STORAGE_KEYS.reports, defaultReports).find(r => r.id === id);
    const container = document.getElementById("editReportContainer");
    if (!report || !container) return;

    document.getElementById("editReportId").value = report.id;
    const reportType = report.type.includes('Activity') ? 'activity' : 'incident';
    document.getElementById("editReportType").value = reportType;
    renderEditReportFields(reportType, report);
    container.style.display = 'block';
}

function renderEditReportFields(type, report = {}) {
    const fieldsDiv = document.getElementById("editReportFields");
    if (!fieldsDiv) return;

    if (type === 'activity') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label for="editActName">Activity Name *</label>
                <input type="text" id="editActName" value="${report.title || ''}" required>
            </div>
            <div class="form-group">
                <label for="editActLead">Activity Lead *</label>
                <input type="text" id="editActLead" value="${report.filedBy || ''}" required>
            </div>
            <div class="form-group">
                <label for="editActDate">Activity Date *</label>
                <input type="date" id="editActDate" value="${report.actDate || ''}" required>
            </div>
            <div class="form-group">
                <label for="editActParticipants">Number of Participants</label>
                <input type="number" id="editActParticipants" value="${report.participants || ''}" min="0">
            </div>
            <div class="form-group">
                <label for="editActDescription">Activity Description</label>
                <textarea id="editActDescription" rows="4">${report.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="editActBudget">Budget Used (KES)</label>
                <input type="number" id="editActBudget" value="${report.budget || ''}" min="0" step="100">
            </div>
        `;
    } else {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label for="editIncType">Incident Type *</label>
                <select id="editIncType" required>
                    <option value="Security" ${report.incType === 'Security' ? 'selected' : ''}>Security</option>
                    <option value="Health" ${report.incType === 'Health' ? 'selected' : ''}>Health</option>
                    <option value="Environmental" ${report.incType === 'Environmental' ? 'selected' : ''}>Environmental</option>
                    <option value="Property Damage" ${report.incType === 'Property Damage' ? 'selected' : ''}>Property Damage</option>
                    <option value="Other" ${report.incType === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editIncLoc">Location *</label>
                <input type="text" id="editIncLoc" value="${report.incLoc || ''}" required>
            </div>
            <div class="form-group">
                <label for="editIncDate">Date & Time *</label>
                <input type="datetime-local" id="editIncDate" value="${report.incDate || ''}" required>
            </div>
            <div class="form-group">
                <label for="editIncReporter">Reporter Name *</label>
                <input type="text" id="editIncReporter" value="${report.filedBy || ''}" required>
            </div>
            <div class="form-group">
                <label for="editIncDescription">Incident Description</label>
                <textarea id="editIncDescription" rows="4">${report.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="editIncInjuries">Injuries/Casualties</label>
                <input type="text" id="editIncInjuries" value="${report.injuries || ''}">
            </div>
            <div class="form-group">
                <label for="editIncDamage">Property Damage</label>
                <input type="text" id="editIncDamage" value="${report.damage || ''}">
            </div>
            <div class="form-group">
                <label for="editIncActions">Actions Taken</label>
                <textarea id="editIncActions" rows="3">${report.actions || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="editIncStatus">Status *</label>
                <select id="editIncStatus" required>
                    <option value="Reported" ${report.status === 'Reported' ? 'selected' : ''}>Reported</option>
                    <option value="Under Investigation" ${report.status === 'Under Investigation' ? 'selected' : ''}>Under Investigation</option>
                    <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
            </div>
        `;
    }
}

function handleEditReportFormSubmission(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("editReportId")?.value, 10);
    const type = document.getElementById("editReportType")?.value;
    let reports = getPortalData(STORAGE_KEYS.reports, defaultReports);
    const index = reports.findIndex(report => report.id === id);
    if (index === -1) return;

    const updated = {
        ...reports[index],
        type: type === 'activity' ? 'Lean Activity Report' : 'Incident Report',
        dateFiled: reports[index].dateFiled,
        title: '',
        filedBy: ''
    };

    if (type === 'activity') {
        updated.title = document.getElementById("editActName")?.value || '';
        updated.filedBy = document.getElementById("editActLead")?.value || '';
        updated.actDate = document.getElementById("editActDate")?.value || '';
        updated.participants = document.getElementById("editActParticipants")?.value || '';
        updated.description = document.getElementById("editActDescription")?.value || '';
        updated.budget = document.getElementById("editActBudget")?.value || '';
        updated.incType = '';
        updated.incLoc = '';
        updated.incDate = '';
        updated.injuries = '';
        updated.damage = '';
        updated.actions = '';
        updated.status = '';
    } else {
        updated.title = `${document.getElementById("editIncType")?.value || ''} - ${document.getElementById("editIncLoc")?.value || ''}`;
        updated.filedBy = document.getElementById("editIncReporter")?.value || '';
        updated.incType = document.getElementById("editIncType")?.value || '';
        updated.incLoc = document.getElementById("editIncLoc")?.value || '';
        updated.incDate = document.getElementById("editIncDate")?.value || '';
        updated.description = document.getElementById("editIncDescription")?.value || '';
        updated.injuries = document.getElementById("editIncInjuries")?.value || '';
        updated.damage = document.getElementById("editIncDamage")?.value || '';
        updated.actions = document.getElementById("editIncActions")?.value || '';
        updated.status = document.getElementById("editIncStatus")?.value || '';
        updated.actDate = '';
        updated.participants = '';
        updated.budget = '';
    }

    reports[index] = updated;
    localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    closeEditReportForm();
    renderDocumentsPage();
    if (document.querySelector("#reportsRegistryTable")) renderReportsTable();
}

function closeEditReportForm() {
    const container = document.getElementById("editReportContainer");
    if (container) container.style.display = 'none';
}

function renderDocumentsProgramsTable() {
    const tableBody = document.querySelector("#documentsProgramsTable tbody");
    if (!tableBody) return;

    const programs = getPortalData(STORAGE_KEYS.programs, defaultPrograms);
    if (programs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding: 20px;">No programs are currently scheduled.</td></tr>`;
        return;
    }

    tableBody.innerHTML = programs.map(p => `
        <tr>
            <td>${p.date}</td>
            <td>${p.venue}</td>
            <td>${p.activityType}</td>
            <td>${p.peopleInCharge}</td>
            <td>${p.itemsNeeded}</td>
            <td>KES ${parseFloat(p.cost || 0).toLocaleString()}</td>
            <td>
                <button class="action-btn-purple" onclick="openEditProgramForm(${p.id})" title="Edit Program">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openEditProgramForm(id) {
    const program = getPortalData(STORAGE_KEYS.programs, defaultPrograms).find(p => p.id === id);
    const container = document.getElementById("editProgramContainer");
    if (!program || !container) return;

    document.getElementById("editProgramId").value = program.id;
    document.getElementById("editProgramDate").value = program.date || '';
    document.getElementById("editProgramVenue").value = program.venue || '';
    document.getElementById("editProgramActivityType").value = program.activityType || '';
    document.getElementById("editProgramPeopleInCharge").value = program.peopleInCharge || '';
    document.getElementById("editProgramItemsNeeded").value = program.itemsNeeded || '';
    document.getElementById("editProgramCost").value = program.cost || '0';
    document.getElementById("editProgramNotes").value = program.notes || '';
    container.style.display = 'block';
}

function handleEditProgramFormSubmission(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("editProgramId")?.value, 10);
    let programs = getPortalData(STORAGE_KEYS.programs, defaultPrograms);
    const index = programs.findIndex(program => program.id === id);
    if (index === -1) return;

    programs[index] = {
        ...programs[index],
        date: document.getElementById("editProgramDate")?.value || '',
        venue: document.getElementById("editProgramVenue")?.value || '',
        activityType: document.getElementById("editProgramActivityType")?.value || '',
        peopleInCharge: document.getElementById("editProgramPeopleInCharge")?.value || '',
        itemsNeeded: document.getElementById("editProgramItemsNeeded")?.value || '',
        cost: document.getElementById("editProgramCost")?.value || '0',
        notes: document.getElementById("editProgramNotes")?.value || ''
    };

    localStorage.setItem(STORAGE_KEYS.programs, JSON.stringify(programs));
    closeEditProgramForm();
    renderDocumentsPage();
    if (document.querySelector("#programsScheduleTable")) renderProgramsTable();
}

function closeEditProgramForm() {
    const container = document.getElementById("editProgramContainer");
    if (container) container.style.display = 'none';
}

function renderDocumentsMediaStore() {
    const mediaGrid = document.getElementById("documentsMediaGrid");
    if (!mediaGrid) return;

    const galleryItems = getPortalData(STORAGE_KEYS.gallery, defaultGallery);
    if (!galleryItems.length) {
        mediaGrid.innerHTML = '<div class="gallery-empty-message"><p>No media uploaded yet.</p></div>';
        return;
    }

    mediaGrid.innerHTML = galleryItems.map(item => `
        <div class="gallery-card">
            <div class="media-card">
                <div class="media-visual">
                    ${item.type === 'video' ? `
                        <video controls>
                            <source src="${item.src}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    ` : `
                        <img src="${item.src}" alt="${item.title}" />
                    `}
                </div>
                <div class="gallery-card-body">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    <small>Category: ${item.category}</small>
                    <button class="delete-row-btn" onclick="deleteMediaItem(${item.id})" title="Delete Media">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderDocumentsPage() {
    if (document.getElementById('documentsReportsTable')) renderDocumentsReportsTable();
    if (document.getElementById('documentsProgramsTable')) renderDocumentsProgramsTable();
    if (document.getElementById('documentsMediaGrid')) renderDocumentsMediaStore();
    if (document.getElementById('memberDocumentsTable')) renderMemberDocumentsTable();
    if (document.getElementById('minutesTable')) renderMinutesTable();
}

function toggleProgramForm() {
    const container = document.getElementById("programFormContainer");
    if (!container) return;
    container.style.display = container.style.display === 'block' ? 'none' : 'block';
}

function hideProgramForm() {
    const container = document.getElementById("programFormContainer");
    if (container) container.style.display = 'none';
}

function handleProgramFormSubmission(e) {
    e.preventDefault();
    
    let programs = getPortalData(STORAGE_KEYS.programs, defaultPrograms);
    
    const programObject = {
        id: Date.now(),
        date: document.getElementById("programDate")?.value || '',
        venue: document.getElementById("programVenue")?.value || '',
        activityType: document.getElementById("programActivityType")?.value || '',
        peopleInCharge: document.getElementById("programPeopleInCharge")?.value || '',
        itemsNeeded: document.getElementById("programItemsNeeded")?.value || '',
        cost: document.getElementById("programCost")?.value || '0',
        notes: document.getElementById("programNotes")?.value || '',
        createdDate: new Date().toLocaleDateString()
    };

    programs.push(programObject);
    localStorage.setItem(STORAGE_KEYS.programs, JSON.stringify(programs));
    
    document.getElementById("programForm")?.reset();
    hideProgramForm();
    renderProgramsTable();
    if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
}

function renderProgramsTable() {
    const tableBody = document.querySelector("#programsScheduleTable tbody");
    if (!tableBody) return;

    let programs = getPortalData(STORAGE_KEYS.programs, defaultPrograms);
    
    if (programs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding: 20px;">No programs scheduled yet.</td></tr>`;
        return;
    }

    tableBody.innerHTML = programs.map(p => `
        <tr>
            <td>${p.date}</td>
            <td>${p.venue}</td>
            <td>${p.activityType}</td>
            <td>${p.peopleInCharge}</td>
            <td>${p.itemsNeeded}</td>
            <td>KES ${parseFloat(p.cost).toLocaleString()}</td>
            <td>
                <button class="delete-row-btn" onclick="deleteProgramRecord(${p.id})" title="Delete Program">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteProgramRecord(id) {
    if (confirm("Are you sure you want to permanently delete this program?")) {
        let programs = getPortalData(STORAGE_KEYS.programs, defaultPrograms);
        programs = programs.filter(program => program.id !== id);
        localStorage.setItem(STORAGE_KEYS.programs, JSON.stringify(programs));
        renderProgramsTable();
        if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
    }
}

function renderGalleryPage(category = "All") {
    const galleryGrid = document.getElementById("galleryGrid");
    if (!galleryGrid) return;

    const galleryItems = getPortalData(STORAGE_KEYS.gallery, defaultGallery);
    const filteredItems = category === "All"
        ? galleryItems
        : galleryItems.filter(item => item.category === category);

    if (!filteredItems.length) {
        galleryGrid.innerHTML = `<div class="gallery-empty-message"><p>No gallery items found for ${category}.</p></div>`;
        return;
    }

    if (category !== "All" && filteredItems.length > 2) {
        const slides = filteredItems.map((item, index) => {
            if (item.type === "video") {
                return `
                    <div class="slide-item ${index === 0 ? 'active' : ''}">
                        <video controls>
                            <source src="${item.src}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            }
            return `
                <div class="slide-item ${index === 0 ? 'active' : ''}">
                    <img src="${item.src}" alt="${item.title}">
                </div>
            `;
        }).join('');

        const dots = filteredItems.map((item, index) => `
            <button class="slideshow-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Slide ${index + 1}"></button>
        `).join('');

        galleryGrid.innerHTML = `
            <div class="slideshow-card">
                <div class="slideshow-wrapper">
                    ${slides}
                </div>
                <div class="media-info">
                    <h3>${filteredItems[0].category} Gallery</h3>
                    <p>${filteredItems.length} items in this category</p>
                </div>
                <div class="slideshow-dots">
                    ${dots}
                </div>
            </div>
        `;

        initGallerySlideshow(filteredItems.length);
        return;
    }

    galleryGrid.innerHTML = filteredItems.map(item => {
        if (item.type === "video") {
            return `
                <div class="media-card">
                    <div class="media-visual">
                        <video controls>
                            <source src="${item.src}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div class="media-info">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="media-card">
                <div class="media-visual">
                    <img src="${item.src}" alt="${item.title}">
                </div>
                <div class="media-info">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
        `;
    }).join('');
}

function initGallerySlideshow(slideCount) {
    const slides = document.querySelectorAll('.slide-item');
    const dots = document.querySelectorAll('.slideshow-dot');
    let index = 0;

    function goToSlide(newIndex) {
        slides.forEach((slide, idx) => slide.classList.toggle('active', idx === newIndex));
        dots.forEach((dot, idx) => dot.classList.toggle('active', idx === newIndex));
        index = newIndex;
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const target = parseInt(dot.dataset.index, 10);
            if (!Number.isNaN(target)) {
                goToSlide(target);
            }
        });
    });

    if (window.gallerySlideTimer) {
        clearInterval(window.gallerySlideTimer);
    }

    window.gallerySlideTimer = setInterval(() => {
        const next = (index + 1) % slideCount;
        goToSlide(next);
    }, 4500);
}

// ====== EXPENDITURE CHART RENDER ======
function updateExpenditureChart(expenses) {
    const chartContainer = document.querySelector('.mock-chart-bars');
    if (!chartContainer) return;

    // Aggregate totals by normalized category
    const totals = {
        Disaster: 0,
        Environment: 0,
        Cleanup: 0,
        Health: 0,
        Other: 0
    };

    expenses.forEach(e => {
        const cat = (e.cat || '').toString().toLowerCase();
        const value = parseInt(e.cash) || 0;
        if (cat.includes('disaster')) totals.Disaster += value;
        else if (cat.includes('env') || cat.includes('eco')) totals.Environment += value;
        else if (cat.includes('clean')) totals.Cleanup += value;
        else if (cat.includes('health')) totals.Health += value;
        else totals.Other += value;
    });

    const max = Math.max(...Object.values(totals), 1);
    // Labels and classes mapping for display order
    const map = [
        { key: 'Disaster', label: 'Disaster', cls: 'disaster' },
        { key: 'Environment', label: 'Eco Action', cls: 'environment' },
        { key: 'Cleanup', label: 'Clean-Up', cls: 'cleanup' },
        { key: 'Health', label: 'Health', cls: 'health' },
        { key: 'Other', label: 'Other', cls: 'other' }
    ];

    chartContainer.innerHTML = map.map(group => {
        const val = totals[group.key];
        const pct = Math.round((val / max) * 100);
        const height = val > 0 ? Math.max(pct, 8) : 4; // ensure visible bar if value >0
        const displayValue = val > 0 ? `KES ${val.toLocaleString()}` : '';
        return `
            <div class="bar-group">
                <div class="bar ${group.cls}" style="height: ${height}%;" title="${group.label}: ${displayValue}"><span>${displayValue}</span></div>
                <label>${group.label}</label>
            </div>
        `;
    }).join('');
}

// ====== SECURE WORKSTATION TERMINATION ======
function terminatePersonnelSession(e) {
    if (e) e.preventDefault();
    
    if (confirm("Are you sure you want to securely close your active session and sign out?")) {
        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        }).finally(() => {
            window.location.href = "portal-login.html";
        });
    }
}

function copyMemberUploadLink() {
    const uploadUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'member-document-upload.html');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(uploadUrl).then(() => {
            alert('Upload link copied to clipboard:\n' + uploadUrl);
        }).catch(() => {
            alert('Unable to copy automatically. Please use this link:\n' + uploadUrl);
        });
    } else {
        alert('Please share this link:\n' + uploadUrl);
    }
}

// Automatically attach this logic to any "Exit Office" sidebar buttons on the page
document.addEventListener("DOMContentLoaded", function() {
    const logoutButtons = document.querySelectorAll(".logout-btn");
    logoutButtons.forEach(logoutBtn => {
        logoutBtn.removeAttribute("href");
        logoutBtn.setAttribute("onclick", "terminatePersonnelSession(event)");
    });
});

// ====== MINUTES UTILITY CONTROLLERS ======

// 1. Open the upload modal window environment
function openDocumentUploadModal(kind) {
    const modal = document.getElementById('documentUploadModal');
    const kindInput = document.getElementById('uploadKind');
    
    if (modal) {
        modal.style.setProperty('display', 'block', 'important');
    }
    if (kindInput) {
        kindInput.value = kind;
    }
}

// 2. Close the upload modal window environment
function closeDocumentUploadModal() {
    const modal = document.getElementById('documentUploadModal');
    const form = document.getElementById('documentUploadForm');
    if (modal) {
        modal.style.display = 'none';
    }
    if (form) {
        form.reset();
    }
}

// 3. Document submission form interceptor listener
document.addEventListener("DOMContentLoaded", function() {
    const docForm = document.getElementById('documentUploadForm');
    if (docForm) {
        docForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const kind = document.getElementById('uploadKind').value;
            // Target the space and special character safely using bracket notation
            const dateTime = document.getElementById('uploadDate & time').value; 
            const venue = document.getElementById('uploadVenue').value.trim();
            const attendees = document.getElementById('uploadAttendees').value.trim();
            const agenda = document.getElementById('uploadAgenda').value.trim();
            const fileInput = document.getElementById('uploadFile');
            const filledBy = document.getElementById('uploadName').value.trim();

            if (!dateTime || !fileInput.files.length) {
                alert("Please fill out all mandatory marked (*) fields.");
                return;
            }

            // Read the uploaded file binary attachment reference
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function(loadEvent) {
                const fileDataUrl = loadEvent.target.result;

                // Structure payload package
                const newDocument = {
                    id: Date.now(),
                    dateTime: new Date(dateTime).toLocaleString(),
                    venue: venue || "Not Specified",
                    attendees: attendees || "Not Specified",
                    agenda: agenda || "Not Specified",
                    fileName: file.name,
                    fileData: fileDataUrl,
                    uploadedBy: filledBy || "Authorized Officer"
                };

                // Fetch storage key based on configuration mappings
                let targetKey = STORAGE_KEYS.minutes; // defaults to minutes
                if (kind === 'policies') targetKey = STORAGE_KEYS.policies;
                if (kind === 'sops') targetKey = STORAGE_KEYS.sops;
                if (kind === 'contracts') targetKey = STORAGE_KEYS.contracts;

                // Pull array, append, and flush back to device
                const dynamicRepository = getPortalData(targetKey, []);
                dynamicRepository.unshift(newDocument); // Add fresh item to top
                localStorage.setItem(targetKey, JSON.stringify(dynamicRepository));

                // Redraw view elements and shut overlay grid
                closeDocumentUploadModal();
                renderMinutesTable(); 
                alert("Minutes documentation uploaded and secured into storage ledger successfully!");
            };

            reader.readAsDataURL(file);
        });
    }

    // Run render loops initially on startup load
    renderMinutesTable();
});

// 4. Render Engine for Minutes Data Table
function renderMinutesTable() {
    const minutesTableBody = document.querySelector("#minutesTable tbody");
    if (!minutesTableBody) return;

    const minutesData = getPortalData(STORAGE_KEYS.minutes, defaultMinutes || []);
    
    if (minutesData.length === 0) {
        minutesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; font-style: italic; padding: 20px;">No meeting minutes found in repository register.</td></tr>`;
        return;
    }

    minutesTableBody.innerHTML = minutesData.map((doc, idx) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px;">${doc.dateTime}</td>
            <td style="padding: 12px;"><strong>${doc.venue}</strong></td>
            <td style="padding: 12px; font-size: 13px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${doc.attendees}">${doc.attendees}</td>
            <td style="padding: 12px; font-size: 13px;">${doc.agenda}</td>
            <td style="padding: 12px;"><i class="fas fa-user-edit"></i> ${doc.uploadedBy}</td>
            <td style="padding: 12px;">
                <a href="${doc.fileData}" download="${doc.fileName}" class="action-btn-purple" style="padding: 4px 8px; font-size: 12px; text-decoration: none; display: inline-block;">
                    <i class="fas fa-download"></i> Get File
                </a>
            </td>
        </tr>
    `).join('');
}

// Replacement function for frontend JavaScript triggers
function triggerStkPushRequest() {
    if (!currentActiveApplication) return;

    document.getElementById('paymentLoadingState').style.display = 'block';

    // 1. Package transaction data payload
    const payload = {
        phoneNumber: document.getElementById('mpesaPhoneNumberConfirm').value.trim(),
        amount: 500,
        accountReference: currentActiveApplication.accountNumber,
        fullName: currentActiveApplication.name,
        pillar: currentActiveApplication.pillar,
        notes: currentActiveApplication.notes
    };

    // 2. Dispatch secure HTTP Post request directly onto the server engine
    fetch('http://localhost:3000/api/mpesa/stkpush', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('paymentLoadingState').style.display = 'none';
        closePaymentModal();

        if (data.success) {
            alert("STK Push Initiated! Enter your M-Pesa PIN on your phone to complete your registration allocation.");
            
            // Reset the registration view status gracefully
            document.getElementById('membershipForm').reset();
            if (document.getElementById('successNotification')) {
                document.getElementById('successNotification').style.display = 'block';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert("Backend Engine Error: " + data.message);
        }
    })
    .catch(error => {
        console.error("Network connection failure:", error);
        document.getElementById('paymentLoadingState').style.display = 'none';
        alert("Could not establish communication with the MRT Backend Server.");
    });
}


// ====== SECURE MINUTES DELETE WITH PIN CHALLENGE ======
function deleteMinutesEntry(id) {
    // 1. Double check intent
    if (!confirm("Are you absolutely sure you want to permanently delete this meeting record from the MRT Vault?")) {
        return; 
    }

    // 2. Prompt for Vault Security configuration PIN
    const securityPin = prompt("🔒 [MRT SECURITY CHALLENGE]\nPlease enter the Vault Security Configuration PIN to authorize entry deletion:");
    
    if (securityPin === null) return; // User pressed Cancel

    // Use your existing vault pin "482901" found in your load data engine
    const CORRECT_VAULT_PIN = "482901"; 

    if (securityPin.trim() !== CORRECT_VAULT_PIN) {
        alert("🚫 Security Denied: Invalid Vault Security PIN. Access revoked.");
        return;
    }

    // 3. Process structural local storage splice removal
    try {
        let minutesList = JSON.parse(localStorage.getItem(STORAGE_KEYS.minutes)) || [];
        
        // Find row item position matching the timestamp ID
        const index = minutesList.findIndex(item => item.id == id);
        
        if (index === -1) {
            alert("Error: Record could not be traced inside the vault data arrays.");
            return;
        }

        // Drop precisely 1 entry at that index location
        minutesList.splice(index, 1);
        
        // Save back clean updated database list
        localStorage.setItem(STORAGE_KEYS.minutes, JSON.stringify(minutesList));
        
        alert("🔒 Security authorized: Record cleanly wiped from the vault repository.");
        
        // Refresh the documents display structure
        if (typeof renderDocumentsPage === 'function') {
            renderDocumentsPage();
        } else {
            window.location.reload();
        }
        
    } catch (error) {
        console.error("Vault manipulation failure:", error);
        alert("Error executing secure database array deletion.");
    }
}


function downloadMinutesPDF(id) {
    // 1. Find the specific record row data from your table or state array
    // For this example, we grab the text content straight from the UI row elements
    const rows = document.querySelectorAll('#minutesTableBody tr');
    let targetData = null;

    // Look for the row that contains the button with this ID attribute
    rows.forEach(row => {
        if (row.innerHTML.includes(`downloadMinutesPDF('${id}')`)) {
            const cells = row.querySelectorAll('td');
            targetData = {
                date: cells[0].innerText,
                venue: cells[1].innerText,
                attendees: cells[2].innerText,
                agenda: cells[3].innerText,
                uploadedBy: cells[4].innerText
            };
        }
    });

    if (!targetData) {
        alert("Error: Could not locate row data.");
        return;
    }

    // 2. Open a clean hidden window to build the document sheet
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    
    // 3. Inject the clean HTML structure with professional style tags
    printWindow.document.write(`
        <html>
        <head>
            <title>MRT_Minutes_${id}</title>
            <style>
                body { font-family: 'Arial', sans-serif; color: #333; margin: 40px; padding: 0; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px solid #0056b3; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #0056b3; font-size: 24px; letter-spacing: 1px; }
                .header p { margin: 5px 0 0 0; font-size: 14px; color: #666; font-weight: bold; }
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .meta-table td { padding: 8px 12px; border: 1px solid #e0e0e0; font-size: 13px; }
                .meta-table td.label { font-weight: bold; background: #f9f9f9; width: 25%; }
                .section-title { font-size: 16px; color: #0056b3; border-left: 4px solid #0056b3; padding-left: 10px; margin: 25px 0 10px 0; font-weight: bold; }
                .content-box { background: #fcfcfc; border: 1px solid #e8e8e8; padding: 15px; border-radius: 4px; font-size: 14px; white-space: pre-wrap; }
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MIRITINI RESPONSE TEAM (MRT)</h1>
                <p>Official Meeting Minutes Record Vault</p>
            </div>

            <table class="meta-table">
                <tr>
                    <td class="label">Document Ref ID:</td>
                    <td>MRT-MIN-${id}</td>
                    <td class="label">Date & Time:</td>
                    <td>${targetData.date}</td>
                </tr>
                <tr>
                    <td class="label">Meeting Venue:</td>
                    <td>${targetData.venue}</td>
                    <td class="label">Compiled By:</td>
                    <td>${targetData.uploadedBy}</td>
                </tr>
            </table>

            <div class="section-title">Meeting Attendees</div>
            <div class="content-box">${targetData.attendees}</div>

            <div class="section-title">Agenda & Meeting Minutes Summary</div>
            <div class="content-box">${targetData.agenda}</div>

            <div class="footer">
                This document is a certified digital copy generated directly from the MRT Internal Operations Desk.
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // 4. Trigger the native browser layout converter window
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// ====== FRONTEND DYNAMIC PDF ENGINE (DEPENDENCY FREE) ======
function downloadMinutesPDF(id) {
    let minutesList = [];
    try {
        minutesList = JSON.parse(localStorage.getItem(STORAGE_KEYS.minutes)) || [];
    } catch (e) {
        alert("Failed to read data vault registry.");
        return;
    }

    // Trace precise matching item record
    const record = minutesList.find(item => item.id == id);

    if (!record) {
        alert("Error: Could not trace target minutes entry inside database arrays.");
        return;
    }

    // Compile stylized print layout document page stream
    const pdfWindow = window.open('', '_blank', 'width=850,height=700');
    
    pdfWindow.document.write(`
        <html>
        <head>
            <title>MRT_Minutes_Log_${record.id}</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; margin: 50px; line-height: 1.5; }
                .mrt-header { text-align: center; border-bottom: 2px dashed #002d62; padding-bottom: 15px; margin-bottom: 30px; }
                .mrt-header h1 { margin: 0; color: #002d62; font-size: 22px; letter-spacing: 0.5px; }
                .mrt-header p { margin: 5px 0 0 0; font-size: 13px; color: #555; text-transform: uppercase; font-weight: bold; }
                .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                .info-grid td { padding: 8px 12px; border: 1px solid #ddd; font-size: 13px; }
                .info-grid td.meta-label { font-weight: bold; background: #f5f7fa; width: 20%; color: #002d62; }
                .section-heading { font-size: 14px; color: #002d62; font-weight: bold; text-transform: uppercase; margin: 20px 0 8px 0; border-bottom: 1px solid #002d62; padding-bottom: 3px; }
                .text-content-box { background: #fafbfc; border: 1px solid #e1e4e8; padding: 12px; border-radius: 4px; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; }
                .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 8px; }
            </style>
        </head>
        <body>
            <div class="mrt-header">
                <h1>MIRITINI RESPONSE TEAM (MRT)</h1>
                <p>Internal Operations Operations Desk — Minutes Vault</p>
            </div>

            <table class="info-grid">
                <tr>
                    <td class="meta-label">Log Ref ID:</td>
                    <td>MRT-MIN-${record.id}</td>
                    <td class="meta-label">Date & Time:</td>
                    <td>${record.date}</td>
                </tr>
                <tr>
                    <td class="meta-label">Meeting Venue:</td>
                    <td>${record.venue}</td>
                    <td class="meta-label">Compiled By:</td>
                    <td>${record.uploadedBy}</td>
                </tr>
            </table>

            <div class="section-heading">Attendance Record</div>
            <div class="text-content-box">${record.attendees}</div>

            <div class="section-heading">Agenda & Minutes Discussion Details</div>
            <div class="text-content-box">${record.agenda}</div>

            <div class="footer">
                This document is an authenticated copy generated from the MRT Central store vault file archive.
            </div>
        </body>
        </html>
    `);

    pdfWindow.document.close();
    pdfWindow.focus();

    // Trigger printing prompt overlay engine smoothly
    setTimeout(() => {
        pdfWindow.print();
        pdfWindow.close();
    }, 400);
}



// ====== CORRECTED MINUTES FORM SUBMISSION LOGIC ======
function submitDocumentUploadForm(event) {
    event.preventDefault();

    // 1. Trace inputs safely
    const dateInput = document.getElementById("uploadDate & time");
    const venueInput = document.getElementById("uploadVenue");
    const attendeesInput = document.getElementById("meeting-attendees"); // Matches textarea id
    const agendaInput = document.getElementById("meeting-agenda"); // Matches textarea id

    if (!dateInput || !venueInput) {
        alert("Required inputs are missing from the interface layout.");
        return;
    }

    // 2. Extract values
    const dateValue = dateInput.value;
    const venueValue = venueInput.value.trim();
    const attendeesValue = attendeesInput ? attendeesInput.value.trim() : "None";
    const agendaValue = agendaInput ? agendaInput.value.trim() : "None";
    
    if (!dateValue || !venueValue) {
        alert("Please provide both Date and Venue details.");
        return;
    }

    // 3. Assemble document payload entry
    const timestampId = Date.now();
    const currentLoggedUser = "Mbaruk Mbaruk"; // Matches your active profile tracker login data

    const newMinutesRecord = {
        id: timestampId,
        date: dateValue.replace("T", " "), // Formats layout string nicely
        venue: venueValue,
        attendees: attendeesValue,
        agenda: agendaValue,
        uploadedBy: currentLoggedUser
    };

    // 4. Update the LocalStorage Repository Vault Array
    let currentVaultMinutes = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.minutes);
        if (stored) currentVaultMinutes = JSON.parse(stored);
    } catch (e) {
        console.error("Failed parsing storage registry:", e);
    }

    currentVaultMinutes.push(newMinutesRecord);
    localStorage.setItem(STORAGE_KEYS.minutes, JSON.stringify(currentVaultMinutes));

    // 5. Interface Housekeeping
    alert("Meeting Minutes successfully logged to the MRT Operations Vault!");
    document.getElementById("documentUploadForm").reset();
    closeDocumentUploadModal();


    // ... inside your submitDocumentUploadForm function layout ...
    localStorage.setItem(STORAGE_KEYS.minutes, JSON.stringify(currentVaultMinutes));

    alert("Meeting Minutes successfully logged to the MRT Operations Vault!");
    document.getElementById("documentUploadForm").reset();
    closeDocumentUploadModal();
    
    // FORCE REAL-TIME UPDATES TO RE-RENDER IMMEDIATELY ON THE PAGE
    renderMinutesTableRepository();
}



// ====== RENDER MINUTES TABLE IN DOCUMENT REPOSITORY ======
function renderMinutesTableRepository() {
    const tableBody = document.getElementById("minutesTableBody");
    // Fallback if your HTML table body doesn't have an ID, look for the element inside #minutesTable
    const fallbackBody = tableBody || document.querySelector("#minutesTable tbody");
    
    if (!fallbackBody) return; // Not on the documents page right now, exit safely

    // Pull the real-time entries out of local storage
    let minutesList = [];
    try {
        minutesList = JSON.parse(localStorage.getItem(STORAGE_KEYS.minutes)) || [];
    } catch (e) {
        console.error("Failed to read minutes storage array:", e);
    }

    // Clear out placeholder or hardcoded table rows
    fallbackBody.innerHTML = "";

    if (minutesList.length === 0) {
        fallbackBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888; padding: 20px;">No meeting minutes archived in the vault yet.</td></tr>`;
        return;
    }

    // Loop through your local array records and inject them with the action features
    fallbackBody.innerHTML = minutesList.map(item => `
        <tr>
            <td>${item.date || 'N/A'}</td>
            <td>${item.venue || 'N/A'}</td>
            <td><div style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.attendees}">${item.attendees || 'N/A'}</div></td>
            <td><div style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.agenda}">${item.agenda || 'N/A'}</div></td>
            <td>${item.uploadedBy || 'Mbaruk Mbaruk'}</td>
            <td>
                <button class="view-btn" style="padding: 4px 8px; font-size:12px;" onclick="alert('Viewing text logs:\\n\\nAgenda:\\n${item.agenda.replace(/'/g, "\\'")}')">View</button>
            </td>
            <td>
                <button class="pdf-icon-btn" onclick="downloadMinutesPDF('${item.id}')" title="Get File as PDF">📄 PDF</button>
                <button class="delete-icon-btn" onclick="deleteMinutesEntry('${item.id}')" title="Delete Entry">🗑️</button>
            </td>
        </tr>
    `).join('');
}


// Inside your DOMContentLoaded listener block, update the document view check:
if (document.querySelector("#documentsReportsTable") || document.querySelector("#documentsProgramsTable") || document.getElementById("minutesTable")) {
    // Run your main pages engine
    if (typeof renderDocumentsPage === 'function') renderDocumentsPage();
    
    // ADD THIS HERE to ensure the minutes list redraws on load!
    renderMinutesTableRepository(); 

    // Trigger rendering refresh
}

// ====== VIEW & EDIT MODAL INJECTION LOGIC ======
function viewMinutesFile(id) {
    // 1. Fetch the exact record data from local storage storage registry
    let minutesList = [];
    try {
        minutesList = JSON.parse(localStorage.getItem(STORAGE_KEYS.minutes)) || [];
    } catch (e) {
        alert("Could not load repository records.");
        return;
    }

    const record = minutesList.find(item => item.id == id);
    if (!record) {
        alert("Record not found.");
        return;
    }

    // 2. Open up your document input modal frame
    if (typeof openDocumentUploadModal === 'function') {
        openDocumentUploadModal('minutes');
    } else {
        const modal = document.getElementById("documentUploadModal");
        if (modal) modal.style.display = "block";
    }

    // 3. Populate your input fields with the existing saved text strings
    const dateInput = document.getElementById("uploadDate & time");
    const venueInput = document.getElementById("uploadVenue");
    const attendeesTextarea = document.getElementById("meeting-attendees");
    const agendaTextarea = document.getElementById("meeting-agenda");

    // Reformat space back into 'T' character to ensure HTML datetime-local inputs can read it cleanly
    if (dateInput && record.date) {
        dateInput.value = record.date.replace(" ", "T");
    }
    if (venueInput) venueInput.value = record.venue || "";
    if (attendeesTextarea) attendeesTextarea.value = record.attendees || "";
    if (agendaTextarea) agendaTextarea.value = record.agenda || "";

    // 4. Attach a data attribute flag to the form so it knows it's editing an existing record
    const form = document.getElementById("documentUploadForm");
    if (form) {
        form.setAttribute("data-editing-id", id);
        
        // Temporarily adjust heading text to show edit mode status
        const modalTitle = document.querySelector("#documentUploadModal h2");
        if (modalTitle) modalTitle.innerHTML = `✏️ Edit Meeting Minutes Record`;
    }
}


function deleteMinutesEntry(id) {
    if (!confirm("Are you absolutely sure you want to permanently delete this meeting record from the MRT Vault?")) {
        return; 
    }

    const securityPin = prompt("🔒 [MRT SECURITY CHALLENGE]\nPlease enter the Vault Security Configuration PIN:");
    if (securityPin === null) return; 

    const CORRECT_VAULT_PIN = "482901"; // Matches your master storage configuration PIN

    if (securityPin.trim() !== CORRECT_VAULT_PIN) {
        alert("🚫 Security Denied: Invalid PIN.");
        return;
    }

    try {
        let minutesList = JSON.parse(localStorage.getItem(STORAGE_KEYS.minutes)) || [];
        const index = minutesList.findIndex(item => item.id == id);
        
        if (index === -1) {
            alert("Error: Record could not be traced inside the vault arrays.");
            return;
        }

        // Remove the item from local storage array
        minutesList.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.minutes, JSON.stringify(minutesList));
        
        alert("🔒 Security authorized: Record cleanly wiped.");
        
        // RE-RENDER SYSTEM WORKSPACE DIRECTLY
        if (typeof renderMinutesTableRepository === 'function') {
            renderMinutesTableRepository(); // Redraws our table rows immediately!
        }
        if (typeof renderDocumentsPage === 'function') {
            renderDocumentsPage(); // Fires your global template manager refresh
        }
        
    } catch (error) {
        console.error("Vault manipulation failure:", error);
    }
}


function submitDocumentUploadForm(event) {
    event.preventDefault();

    const dateInput = document.getElementById("uploadDate & time");
    const venueInput = document.getElementById("uploadVenue");
    const attendeesInput = document.getElementById("meeting-attendees");
    const agendaInput = document.getElementById("meeting-agenda");
    const form = document.getElementById("documentUploadForm");

    const dateValue = dateInput ? dateInput.value : "";
    const venueValue = venueInput ? venueInput.value.trim() : "";
    const attendeesValue = attendeesInput ? attendeesInput.value.trim() : "";
    const agendaValue = agendaInput ? agendaInput.value.trim() : "";

    let minutesList = JSON.parse(localStorage.getItem(STORAGE_KEYS.minutes)) || [];
    
    // Check if we are saving changes to an existing row or making a brand new one
    const editingId = form ? form.getAttribute("data-editing-id") : null;

    if (editingId) {
        // --- EDITING MODE ROUTINE ---
        const index = minutesList.findIndex(item => item.id == editingId);
        if (index !== -1) {
            minutesList[index].date = dateValue.replace("T", " ");
            minutesList[index].venue = venueValue;
            minutesList[index].attendees = attendeesValue;
            minutesList[index].agenda = agendaValue;
        }
        form.removeAttribute("data-editing-id"); // Clear flag out
        alert("Meeting details successfully updated!");
    } else {
        // --- CREATING NEW MODE ROUTINE ---
        const newRecord = {
            id: Date.now(),
            date: dateValue.replace("T", " "),
            venue: venueValue,
            attendees: attendeesValue,
            agenda: agendaValue,
            uploadedBy: "Mbaruk Mbaruk"
        };
        minutesList.push(newRecord);
        alert("New minutes saved to the MRT Repository!");
    }

    localStorage.setItem(STORAGE_KEYS.minutes, JSON.stringify(minutesList));
    form.reset();
    closeDocumentUploadModal();
    
    // Reset modal header text back to standard title state
    const modalTitle = document.querySelector("#documentUploadModal h2");
    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-upload"></i> Upload Document`;

    renderMinutesTableRepository();
}

// Inside your login form submission handler:
const portallogin = document.querySelector('.portal-login');

if (portallogin) {
    portallogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('login-username').value;
        const passwordInput = document.getElementById('login-password').value;
        const messageDisplay = document.getElementById('loginMessage');

        try {
            // Because of our folder structure, we can call the endpoint directly
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameInput,
                    password: passwordInput
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                messageDisplay.style.color = "green";
                messageDisplay.innerText = "Credentials verified! Accessing workspace...";
                
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1500);
            } else {
                messageDisplay.style.color = "red";
                messageDisplay.innerText = data.message || "Invalid credentials configuration.";
            }
        } catch (error) {
            console.error("API Network Error:", error);
            messageDisplay.style.color = "red";
            messageDisplay.innerText = "Failed to communicate with the internal portal server.";
        }
    });
}