/**
 * Smart Bulk Import - AI-Powered Data Extraction
 * Uses Claude API to parse any file format (CSV, Excel, PDF, TXT)
 * and extract structured staff or medication data
 */

// Global state for smart import
let smartImportData = {
    type: null, // 'staff' or 'medications'
    parsedRecords: [],
    fileName: ''
};

/**
 * Initialize Smart Import for Staff
 */
function initSmartStaffImport() {
    smartImportData.type = 'staff';
    openModal('smart-import-welcome');
}

/**
 * Initialize Smart Import for Medications
 */
function initSmartMedicationImport() {
    smartImportData.type = 'medications';
    openModal('smart-import-welcome');
}

/**
 * Initialize Smart Import for Incidents
 */
function initSmartIncidentImport() {
    smartImportData.type = 'incidents';
    openModal('smart-import-welcome');
}

/**
 * Open file picker after user confirms in welcome modal
 */
function selectSmartImportFile() {
    closeModal('smart-import-welcome');
    document.getElementById('smart-import-file').click();
}

/**
 * Handle file selection
 */
async function handleSmartImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const supportedFormats = ['.csv', '.xlsx', '.xls', '.pdf', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!supportedFormats.includes(fileExt)) {
        showError(`Unsupported file format. Please upload: ${supportedFormats.join(', ')}`);
        event.target.value = '';
        return;
    }

    smartImportData.fileName = file.name;

    // Show processing modal
    openModal('smart-import-processing');
    updateProcessingStatus('uploading', 'Uploading file...');

    try {
        // Upload file for AI parsing
        const formData = new FormData();
        formData.append('file', file);

        updateProcessingStatus('parsing', '🤖 AI is analyzing your file...');

        const response = await apiRequest(
            `/facilities/${AppState.facility.id}/smart-import/${smartImportData.type}`,
            {
                method: 'POST',
                body: formData,
                isFormData: true
            }
        );

        updateProcessingStatus('complete', `✓ Parsed ${response.data.length} records!`);

        // Store parsed data
        smartImportData.parsedRecords = response.data;

        // Wait a moment then show verification screen
        setTimeout(() => {
            closeModal('smart-import-processing');
            showVerificationScreen();
        }, 1000);

    } catch (error) {
        console.error('Smart import error:', error);
        updateProcessingStatus('error', '❌ Parsing failed');
        setTimeout(() => {
            closeModal('smart-import-processing');
            showError(error.message || 'Failed to parse file. Please check the format and try again.');
        }, 1500);
    }

    // Reset file input
    event.target.value = '';
}

/**
 * Update processing status in modal
 */
function updateProcessingStatus(stage, message) {
    const statusEl = document.getElementById('processing-status-text');
    const spinnerEl = document.getElementById('processing-spinner');

    if (statusEl) statusEl.textContent = message;

    if (stage === 'complete') {
        if (spinnerEl) spinnerEl.style.display = 'none';
    } else if (stage === 'error') {
        if (spinnerEl) spinnerEl.style.display = 'none';
    }
}

/**
 * Show verification screen with parsed data
 */
function showVerificationScreen() {
    const modal = document.getElementById('smart-import-verify');
    const titleEl = document.getElementById('verify-title');
    const subtitleEl = document.getElementById('verify-subtitle');
    const tableEl = document.getElementById('verify-table-body');

    if (!modal || !tableEl) {
        console.error('Verification modal elements not found');
        return;
    }

    // Update title
    if (titleEl) {
        titleEl.textContent = smartImportData.type === 'staff'
            ? 'Verify Staff Data'
            : 'Verify Medication Data';
    }

    if (subtitleEl) {
        subtitleEl.textContent = `${smartImportData.parsedRecords.length} records found in "${smartImportData.fileName}". Review and edit before importing.`;
    }

    // Build verification table
    if (smartImportData.type === 'staff') {
        buildStaffVerificationTable(tableEl);
    } else if (smartImportData.type === 'medications') {
        buildMedicationVerificationTable(tableEl);
    } else if (smartImportData.type === 'incidents') {
        buildIncidentVerificationTable(tableEl);
    }

    openModal('smart-import-verify');
}

/**
 * Build staff verification table
 */
function buildStaffVerificationTable(tableEl) {
    tableEl.innerHTML = smartImportData.parsedRecords.map((staff, index) => `
    <tr data-index="${index}">
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(staff.name || '')}" 
          onchange="updateVerifyRecord(${index}, 'name', this.value)" required>
      </td>
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(staff.role || '')}" 
          onchange="updateVerifyRecord(${index}, 'role', this.value)">
      </td>
      <td>
        <input type="email" class="cac-input" value="${escapeHtml(staff.email || '')}" 
          onchange="updateVerifyRecord(${index}, 'email', this.value)">
      </td>
      <td>
        <input type="tel" class="cac-input" value="${escapeHtml(staff.phone || '')}" 
          onchange="updateVerifyRecord(${index}, 'phone', this.value)">
      </td>
      <td>
        <button class="cac-btn cac-btn-sm cac-btn-danger" onclick="removeVerifyRecord(${index})" 
          style="padding: 4px 8px; font-size: 0.75rem;">
          🗑️ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Build medication verification table
 */
function buildMedicationVerificationTable(tableEl) {
    tableEl.innerHTML = smartImportData.parsedRecords.map((med, index) => `
    <tr data-index="${index}">
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(med.childName || '')}" 
          onchange="updateVerifyRecord(${index}, 'childName', this.value)" required>
      </td>
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(med.medicationName || '')}" 
          onchange="updateVerifyRecord(${index}, 'medicationName', this.value)" required>
      </td>
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(med.dosage || '')}" 
          onchange="updateVerifyRecord(${index}, 'dosage', this.value)" required>
      </td>
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(med.frequency || '')}" 
          onchange="updateVerifyRecord(${index}, 'frequency', this.value)">
      </td>
      <td>
        <button class="cac-btn cac-btn-sm cac-btn-danger" onclick="removeVerifyRecord(${index})" 
          style="padding: 4px 8px; font-size: 0.75rem;">
          🗑️ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Build incident verification table
 */
function buildIncidentVerificationTable(tableEl) {
    tableEl.innerHTML = smartImportData.parsedRecords.map((incident, index) => `
    <tr data-index="${index}">
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(incident.childName || '')}" 
          onchange="updateVerifyRecord(${index}, 'childName', this.value)" required>
      </td>
      <td>
        <select class="cac-select" onchange="updateVerifyRecord(${index}, 'type', this.value)">
          <option value="injury" ${incident.type === 'injury' ? 'selected' : ''}>Injury</option>
          <option value="illness" ${incident.type === 'illness' ? 'selected' : ''}>Illness</option>
          <option value="behavior" ${incident.type === 'behavior' ? 'selected' : ''}>Behavior</option>
          <option value="other" ${incident.type === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </td>
      <td>
        <select class="cac-select" onchange="updateVerifyRecord(${index}, 'severity', this.value)">
          <option value="minor" ${incident.severity === 'minor' ? 'selected' : ''}>Minor</option>
          <option value="moderate" ${incident.severity === 'moderate' ? 'selected' : ''}>Moderate</option>
          <option value="major" ${incident.severity === 'major' ? 'selected' : ''}>Major</option>
          <option value="critical" ${incident.severity === 'critical' ? 'selected' : ''}>Critical</option>
        </select>
      </td>
      <td>
        <input type="text" class="cac-input" value="${escapeHtml(incident.description || '')}" 
          onchange="updateVerifyRecord(${index}, 'description', this.value)" required>
      </td>
      <td>
        <button class="cac-btn cac-btn-sm cac-btn-danger" onclick="removeVerifyRecord(${index})" 
          style="padding: 4px 8px; font-size: 0.75rem;">
          🗑️ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Update a record in verification screen
 */
function updateVerifyRecord(index, field, value) {
    if (smartImportData.parsedRecords[index]) {
        smartImportData.parsedRecords[index][field] = value;
    }
}

/**
 * Remove a record from verification screen
 */
function removeVerifyRecord(index) {
    const row = document.querySelector(`#verify-table-body tr[data-index="${index}"]`);
    if (row) {
        row.remove();
        smartImportData.parsedRecords.splice(index, 1);

        // Update subtitle
        const subtitleEl = document.getElementById('verify-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = `${smartImportData.parsedRecords.length} records remaining. Review and edit before importing.`;
        }
    }
}

/**
 * Confirm and import all verified records
 */
async function confirmSmartImport() {
    if (smartImportData.parsedRecords.length === 0) {
        showError('No records to import');
        return;
    }

    const button = document.getElementById('confirm-smart-import-btn');
    setLoading(button, true);

    try {
        let endpoint;
        if (smartImportData.type === 'staff') {
            endpoint = `/facilities/${AppState.facility.id}/bulk-import/staff`;
        } else if (smartImportData.type === 'medications') {
            endpoint = `/facilities/${AppState.facility.id}/bulk-import/medications`;
        } else if (smartImportData.type === 'incidents') {
            endpoint = `/facilities/${AppState.facility.id}/bulk-import/incidents`;
        }

        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({ data: smartImportData.parsedRecords })
        });

        closeModal('smart-import-verify');
        showSuccess(`✓ Successfully imported ${response.success} ${smartImportData.type}!`);

        // Reload the appropriate list
        if (smartImportData.type === 'staff') {
            await loadStaffList();
        } else if (smartImportData.type === 'medications') {
            await loadMedicationList();
        } else if (smartImportData.type === 'incidents') {
            await loadIncidentList();
        }

        // Reset state
        smartImportData = {
            type: null,
            parsedRecords: [],
            fileName: ''
        };

    } catch (error) {
        console.error('Bulk import error:', error);
        showError(error.message || 'Failed to import records');
    } finally {
        setLoading(button, false);
    }
}

/**
 * Cancel smart import
 */
function cancelSmartImport() {
    smartImportData = {
        type: null,
        parsedRecords: [],
        fileName: ''
    };
    closeModal('smart-import-verify');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Make functions globally available
window.initSmartStaffImport = initSmartStaffImport;
window.initSmartMedicationImport = initSmartMedicationImport;
window.initSmartIncidentImport = initSmartIncidentImport;
window.selectSmartImportFile = selectSmartImportFile;
window.handleSmartImportFile = handleSmartImportFile;
window.updateVerifyRecord = updateVerifyRecord;
window.removeVerifyRecord = removeVerifyRecord;
window.confirmSmartImport = confirmSmartImport;
window.cancelSmartImport = cancelSmartImport;
