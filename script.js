// Cấu hình Google Sheets API
const SHEET_ID = '1NGHViIVB_LYaJs5GqZ6XQ5xv3eNkex3ZjEmVn13ztNI';
const API_KEY = 'YOUR_GOOGLE_SHEETS_API_KEY'; // Cần thay thế bằng API key thực tế
const EMPLOYEES_SHEET_NAME = 'Nhân viên';
const EMPLOYEES_RANGE = 'B2:B'; // Cột chứa họ tên nhân viên
const COMPONENTS_SHEET_NAME = 'Linh kiện';
const COMPONENTS_RANGE = 'A2:C'; // Cột A: nhóm, cột B: tên linh kiện, cột C: số lượng còn lại
const LOG_SHEET_NAME = 'Nhật ký';
const LOG_RANGE = 'A:E'; // Cột A đến E để lưu dữ liệu log

// Trạng thái ứng dụng
let employees = [];
let components = {}; // Object chứa nhóm và linh kiện: {groupA: [item1, item2], groupB: [item3, item4]}
let componentStock = {}; // Object chứa số lượng còn lại: {componentName: quantity}
let selectedComponents = {}; // Object chứa linh kiện đã chọn và số lượng
let isLoadingEmployees = false;
let isLoadingComponents = false;

// DOM elements
const employeeSelect = document.getElementById('employeeName');
const loadingIndicator = document.getElementById('employeeLoading');
const form = document.getElementById('componentReportForm');

// Component elements
const componentGroup = document.getElementById('componentGroup');
const componentLoading = document.getElementById('componentLoading');
const componentAccordion = document.getElementById('componentAccordion');

// Purpose elements
const purposeGroup = document.getElementById('purposeGroup');
const purposeCompany = document.getElementById('purposeCompany');
const purposeExternal = document.getElementById('purposeExternal');
const externalPurposeDetails = document.getElementById('externalPurposeDetails');
const externalDescription = document.getElementById('externalDescription');

// Date elements
const dateGroup = document.getElementById('dateGroup');
const implementationDate = document.getElementById('implementationDate');

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Component Management System initialized');
    
    // Check if all DOM elements exist
    console.log('DOM elements check:');
    console.log('- employeeSelect:', !!employeeSelect);
    console.log('- componentGroup:', !!componentGroup);
    console.log('- componentAccordion:', !!componentAccordion);
    console.log('- componentLoading:', !!componentLoading);
    
    loadEmployees();
    loadComponents();
    setupEventListeners();
    
    // Show first step as active
    const step1 = document.getElementById('step1');
    if (step1) {
        step1.classList.add('active');
    }
});

// Thiết lập event listeners
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });

    // Employee select change event
    employeeSelect.addEventListener('change', function() {
        if (validateEmployeeSelection()) {
            showComponentGroup();
        }
    });

    // Purpose radio button change events
    purposeCompany.addEventListener('change', function() {
        handlePurposeChange();
    });

    purposeExternal.addEventListener('change', function() {
        handlePurposeChange();
    });

    // External description validation
    externalDescription.addEventListener('input', function() {
        validatePurposeSelection();
    });

    // Implementation date validation
    implementationDate.addEventListener('change', function() {
        validateDateSelection();
    });
}

// Load danh sách nhân viên từ Google Sheets
async function loadEmployees() {
    if (isLoadingEmployees) return;

    isLoadingEmployees = true;
    showLoading(true);
    clearError();

    try {
        console.log('📥 Loading employees from Google Sheets...');
        
        // Tạm thời sử dụng fetch với Google Sheets public CSV URL
        // Điều này hoạt động nếu sheet được chia sẻ công khai
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(EMPLOYEES_SHEET_NAME)}&range=${EMPLOYEES_RANGE}`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        employees = parseCSVEmployees(csvData);
        
        if (employees.length === 0) {
            throw new Error('Không tìm thấy dữ liệu nhân viên');
        }
        
        populateEmployeeSelect(employees);
        console.log(`✅ Loaded ${employees.length} employees successfully`);
        
    } catch (error) {
        console.error('❌ Error loading employees:', error);
        showError(`Không tải được nhân viên: ${error.message}`);
    } finally {
        isLoadingEmployees = false;
        showLoading(false);
    }
}

// Parse CSV data để lấy danh sách nhân viên
function parseCSVEmployees(csvData) {
    const lines = csvData.trim().split('\n');
    const employeeNames = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line !== '""') {
            // Loại bỏ dấu ngoặc kép nếu có
            const name = line.replace(/"/g, '').trim();
            if (name && name !== 'Họ và tên') { // Bỏ qua header nếu có
                employeeNames.push(name);
            }
        }
    }
    
    // Loại bỏ duplicate nhưng giữ nguyên thứ tự từ Google Sheets
    return [...new Set(employeeNames)];
}

// Parse CSV data để lấy danh sách linh kiện theo nhóm
async function loadComponents() {
    console.log('🔄 loadComponents called, isLoadingComponents:', isLoadingComponents);
    
    if (isLoadingComponents) {
        console.log('❌ Already loading components, skipping');
        return;
    }

    console.log('🔄 Starting loadComponents...');
    isLoadingComponents = true;
    showComponentLoading(true);

    try {
        console.log('📦 Loading components from Google Sheets...');
        
        // Tạm thời sử dụng fetch với Google Sheets public CSV URL
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COMPONENTS_SHEET_NAME)}&range=${COMPONENTS_RANGE}`;
        
        console.log('🌐 Fetching from URL:', csvUrl);
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        console.log('📄 CSV data received:', csvData.substring(0, 200) + '...');
        components = parseCSVComponents(csvData);
        
        if (Object.keys(components).length === 0) {
            throw new Error('Không tìm thấy dữ liệu linh kiện');
        }
        
        populateComponentAccordion(components);
        console.log(`✅ Loaded ${Object.keys(components).length} component groups successfully`);
        
    } catch (error) {
        console.error('❌ Error loading components:', error);
        showError(`Không tải được linh kiện: ${error.message}`);
    } finally {
        isLoadingComponents = false;
        showComponentLoading(false);
    }
}

// Parse CSV data để lấy danh sách linh kiện theo nhóm
function parseCSVComponents(csvData) {
    const lines = csvData.trim().split('\n');
    const componentGroups = {};
    const groupOrder = []; // Array để lưu thứ tự các nhóm
    const stockData = {};
    let currentGroup = null;
    
    console.log('🔍 Parsing CSV lines:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Split CSV line, handle quoted values
            const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
            const groupCell = parts[0]; // Cột A
            const componentCell = parts[1]; // Cột B
            const stockCell = parts[2]; // Cột C - số lượng còn lại
            
            console.log(`Line ${i + 1}: Group="${groupCell}", Component="${componentCell}", Stock="${stockCell}"`);
            
            // Skip header row
            if (groupCell === 'Nhóm' || componentCell === 'Linh kiện') {
                console.log('Skipping header row');
                continue;
            }
            
            // Nếu cột A có giá trị, đây là nhóm mới
            if (groupCell && groupCell.trim() !== '') {
                currentGroup = groupCell.trim();
                console.log(`📦 New group detected: ${currentGroup}`);
                
                // Khởi tạo nhóm nếu chưa có
                if (!componentGroups[currentGroup]) {
                    componentGroups[currentGroup] = [];
                    groupOrder.push(currentGroup); // Lưu thứ tự xuất hiện
                }
            }
            
            // Nếu cột B có giá trị và đang có nhóm hiện tại
            if (componentCell && componentCell.trim() !== '' && currentGroup) {
                const componentName = componentCell.trim();
                const stockQuantity = parseInt(stockCell) || 0; // Parse số lượng còn lại
                
                componentGroups[currentGroup].push(componentName);
                stockData[componentName] = stockQuantity;
                
                console.log(`  ➕ Added "${componentName}" (stock: ${stockQuantity}) to group ${currentGroup}`);
            }
        }
    }
    
    // Cập nhật global componentStock và lưu thứ tự nhóm
    componentStock = stockData;
    componentGroups._order = groupOrder; // Lưu thứ tự để sử dụng sau
    
    console.log('🎯 Final parsed groups:', componentGroups);
    console.log('📊 Group order:', groupOrder);
    console.log('📊 Stock data:', stockData);
    return componentGroups;
}

// Populate component category select
function populateComponentAccordion(componentGroups) {
    console.log('🎯 Populating component accordion with:', componentGroups);
    
    // Clear existing accordion
    componentAccordion.innerHTML = '';
    
    // Create accordion groups - use original order from Google Sheets
    const groupOrder = componentGroups._order || Object.keys(componentGroups);
    groupOrder.forEach(group => {
        if (group !== '_order' && componentGroups[group]) { // Skip the _order property
            console.log(`Creating group: ${group} with components:`, componentGroups[group]);
            const groupElement = createComponentGroup(group, componentGroups[group]);
            componentAccordion.appendChild(groupElement);
        }
    });
    
    // Show the accordion
    componentAccordion.style.display = 'block';
    console.log('✅ Component accordion displayed');
}

// Create component group element for accordion
function createComponentGroup(groupName, groupComponents) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'component-group';
    groupDiv.dataset.group = groupName;

    // Create header
    const header = document.createElement('div');
    header.className = 'group-header';
    header.onclick = () => toggleGroup(groupName);
    
    header.innerHTML = `
        <div class="group-title">
            <span class="group-icon">📦</span>
            <span>${groupName}</span>
            <span class="group-info">(${groupComponents.length} linh kiện)</span>
        </div>
        <span class="expand-icon">⌄</span>
    `;

    // Create content
    const content = document.createElement('div');
    content.className = 'group-content';
    content.id = `group-content-${groupName}`;

    const componentList = document.createElement('div');
    componentList.className = 'component-list';

    // Add components to the list
    groupComponents.forEach((componentName, index) => {
        const componentItem = createComponentItem(componentName, groupName, index);
        componentList.appendChild(componentItem);
    });

    content.appendChild(componentList);
    groupDiv.appendChild(header);
    groupDiv.appendChild(content);

    return groupDiv;
}

// Toggle group expand/collapse
function toggleGroup(groupName) {
    const header = document.querySelector(`[data-group="${groupName}"] .group-header`);
    const content = document.getElementById(`group-content-${groupName}`);
    const expandIcon = header.querySelector('.expand-icon');

    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        // Collapse
        content.classList.remove('expanded');
        header.classList.remove('active');
        expandIcon.classList.remove('expanded');
    } else {
        // Expand
        content.classList.add('expanded');
        header.classList.add('active');
        expandIcon.classList.add('expanded');
    }

    console.log(`${isExpanded ? '📁' : '📂'} Group ${groupName} ${isExpanded ? 'collapsed' : 'expanded'}`);
}

// Populate select box với danh sách nhân viên
function populateEmployeeSelect(employeeList) {
    // Clear existing options (except the first placeholder)
    employeeSelect.innerHTML = '<option value="">Chọn tên của bạn...</option>';
    
    // Add employee options
    employeeList.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee;
        option.textContent = employee;
        employeeSelect.appendChild(option);
    });
    
    // Enable the select
    employeeSelect.disabled = false;
}

// Validate employee selection
function validateEmployeeSelection() {
    const selectedValue = employeeSelect.value;
    
    if (selectedValue) {
        employeeSelect.classList.remove('error');
        employeeSelect.classList.add('success');
        return true;
    } else {
        employeeSelect.classList.remove('success');
        return false;
    }
}

// Show component group section
function showComponentGroup() {
    console.log('👀 Showing component selection step');
    componentGroup.style.display = 'block';
    componentGroup.classList.add('active');
    
    // Also ensure accordion is visible if components are loaded
    if (Object.keys(components).length > 0) {
        console.log('📦 Components available, showing accordion');
        componentAccordion.style.display = 'block';
    }
}

// Show purpose group section
function showPurposeGroup() {
    console.log('🎯 Showing purpose selection step');
    purposeGroup.style.display = 'block';
    purposeGroup.classList.add('active');
}

// Show date group section
function showDateGroup() {
    console.log('📅 Showing date selection step');
    dateGroup.style.display = 'block';
    dateGroup.classList.add('active');
    
    // Set default date to today
    if (!implementationDate.value) {
        const today = new Date().toISOString().split('T')[0];
        implementationDate.value = today;
        validateDateSelection();
    }
}

// Handle purpose selection change
function handlePurposeChange() {
    const selectedPurpose = document.querySelector('input[name="purpose"]:checked');
    
    // Update radio option styles
    document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    if (selectedPurpose) {
        selectedPurpose.closest('.radio-option').classList.add('selected');
        console.log(`🎯 Purpose selected: ${selectedPurpose.value}`);
        
        if (selectedPurpose.value === 'external') {
            // Show external details
            externalPurposeDetails.style.display = 'block';
            externalDescription.focus();
            // Add required attribute for external description
            externalDescription.setAttribute('required', 'required');
        } else {
            // Hide external details and clear values
            externalPurposeDetails.style.display = 'none';
            externalDescription.value = '';
            // Clear any error states for external description
            externalDescription.classList.remove('error', 'success');
            // Remove required attribute for company purpose
            externalDescription.removeAttribute('required');
        }
    }
    
    validatePurposeSelection();
    
    // Show date group when purpose is selected
    if (selectedPurpose) {
        showDateGroup();
    }
}

// Validate purpose selection
function validatePurposeSelection() {
    const selectedPurpose = document.querySelector('input[name="purpose"]:checked');
    
    console.log('🔍 validatePurposeSelection called');
    console.log('Selected purpose:', selectedPurpose ? selectedPurpose.value : 'None');
    
    if (!selectedPurpose) {
        console.log('❌ No purpose selected');
        return false;
    }
    
    // If external purpose is selected, validate description
    if (selectedPurpose.value === 'external') {
        const description = externalDescription.value.trim();
        console.log('🌍 External purpose selected, description:', description);
        if (!description) {
            console.log('❌ External description required but empty');
            externalDescription.classList.add('error');
            externalDescription.classList.remove('success');
            return false;
        } else {
            console.log('✅ External description valid');
            externalDescription.classList.remove('error');
            externalDescription.classList.add('success');
        }
    } else {
        // For company purpose, no description needed, just clear any error states
        console.log('🏢 Company purpose selected - no description needed');
        externalDescription.classList.remove('error', 'success');
    }
    
    console.log('✅ Purpose validation passed');
    return true;
}

// Validate date selection
function validateDateSelection() {
    const selectedDate = implementationDate.value;
    
    if (!selectedDate) {
        implementationDate.classList.add('error');
        implementationDate.classList.remove('success');
        return false;
    }
    
    // Check if date is not in the future (more than today)
    const today = new Date().toISOString().split('T')[0];
    const selected = new Date(selectedDate);
    const todayDate = new Date(today);
    
    if (selected > todayDate) {
        implementationDate.classList.add('error');
        implementationDate.classList.remove('success');
        return false;
    }
    
    implementationDate.classList.remove('error');
    implementationDate.classList.add('success');
    return true;
}

// Create individual component item with checkbox and quantity input
function createComponentItem(componentName, groupName, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'component-item';
    itemDiv.dataset.component = componentName;
    itemDiv.dataset.group = groupName;

    const checkboxId = `component_${groupName}_${index}`;
    const quantityId = `quantity_${groupName}_${index}`;
    const stockQuantity = componentStock[componentName] || 0;
    
    // Disable checkbox if stock is 0
    const isOutOfStock = stockQuantity <= 0;
    const stockDisplay = isOutOfStock ? 'Hết hàng' : `Còn: ${stockQuantity}`;
    const stockClass = isOutOfStock ? 'out-of-stock' : 'in-stock';

    itemDiv.innerHTML = `
        <div class="component-info">
            <input type="checkbox" 
                   id="${checkboxId}" 
                   class="component-checkbox" 
                   value="${componentName}"
                   ${isOutOfStock ? 'disabled' : ''}
                   onchange="handleComponentCheck(this, '${componentName}', '${quantityId}')">
            <label for="${checkboxId}" class="component-name ${isOutOfStock ? 'disabled' : ''}">
                ${componentName} <span class="stock-info ${stockClass}">(${stockDisplay})</span>
            </label>
        </div>
        <input type="number" 
               id="${quantityId}" 
               class="quantity-input" 
               placeholder="Số lượng" 
               min="1" 
               max="${stockQuantity}"
               disabled
               style="display: none;"
               onchange="handleQuantityChange(this, '${componentName}')">
    `;

    return itemDiv;
}

// Handle component checkbox change
function handleComponentCheck(checkbox, componentName, quantityId) {
    const quantityInput = document.getElementById(quantityId);
    const componentItem = checkbox.closest('.component-item');

    if (checkbox.checked) {
        // Show and enable quantity input
        quantityInput.style.display = 'block';
        quantityInput.disabled = false;
        quantityInput.focus();
        quantityInput.value = '1'; // Default value
        componentItem.classList.add('selected');
        
        // Add to selected components
        selectedComponents[componentName] = 1;
        
        console.log(`✅ Selected component: ${componentName}`);
    } else {
        // Hide and disable quantity input
        quantityInput.style.display = 'none';
        quantityInput.disabled = true;
        quantityInput.value = '';
        componentItem.classList.remove('selected');
        
        // Remove from selected components
        delete selectedComponents[componentName];
        
        console.log(`❌ Deselected component: ${componentName}`);
    }

    // Show purpose group if this is the first component selected
    if (Object.keys(selectedComponents).length === 1 && checkbox.checked) {
        showPurposeGroup();
    }
}

// Handle quantity input change
function handleQuantityChange(input, componentName) {
    const quantity = parseInt(input.value);
    const stockQuantity = componentStock[componentName] || 0;
    
    if (quantity && quantity > 0) {
        if (quantity > stockQuantity) {
            // Nếu vượt quá số lượng còn lại, reset về max
            input.value = stockQuantity;
            selectedComponents[componentName] = stockQuantity;
            showError(`Số lượng "${componentName}" không được vượt quá ${stockQuantity}!`);
            console.log(`⚠️ Quantity exceeded for ${componentName}, reset to ${stockQuantity}`);
        } else {
            selectedComponents[componentName] = quantity;
            console.log(`📊 Updated quantity for ${componentName}: ${quantity}`);
        }
    } else {
        // If invalid quantity, reset to 1
        input.value = '1';
        selectedComponents[componentName] = 1;
    }
}

function showComponentLoading(show) {
    componentLoading.style.display = show ? 'flex' : 'none';
}

// Handle form submission
async function handleFormSubmit() {
    // Validate employee selection
    if (!validateEmployeeSelection()) {
        showError('Vui lòng chọn tên.');
        employeeSelect.classList.add('error');
        employeeSelect.focus();
        return;
    }

    // Validate component selection
    if (Object.keys(selectedComponents).length === 0) {
        showError('Vui lòng chọn ít nhất 1 linh kiện.');
        // Focus on first accordion group instead
        const firstGroupHeader = document.querySelector('.group-header');
        if (firstGroupHeader) {
            firstGroupHeader.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    // Validate purpose selection
    console.log('🎯 Starting purpose validation...');
    if (!validatePurposeSelection()) {
        const selectedPurpose = document.querySelector('input[name="purpose"]:checked');
        console.log('❌ Purpose validation failed');
        console.log('Selected purpose value:', selectedPurpose ? selectedPurpose.value : 'None');
        
        if (!selectedPurpose) {
            console.log('No purpose selected - showing error');
            showError('Vui lòng chọn mục đích sử dụng.');
            purposeGroup.scrollIntoView({ behavior: 'smooth' });
        } else if (selectedPurpose.value === 'external') {
            console.log('External purpose but description missing - showing error');
            showError('Vui lòng nhập tên công ty/địa chỉ.');
            externalDescription.focus();
        } else {
            // This should not happen if logic is correct, but just in case
            console.log('Unexpected validation failure for purpose:', selectedPurpose.value);
            showError('Có lỗi trong việc validate mục đích sử dụng.');
            purposeGroup.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }
    console.log('✅ Purpose validation passed');

    // Validate date selection
    if (!validateDateSelection()) {
        const selectedDate = implementationDate.value;
        if (!selectedDate) {
            showError('Vui lòng chọn ngày.');
        } else {
            showError('Ngày không được ở tương lai.');
        }
        implementationDate.focus();
        return;
    }
    
    const selectedEmployee = employeeSelect.value;
    const selectedPurpose = document.querySelector('input[name="purpose"]:checked');
    const selectedDate = implementationDate.value;
    
    const purposeData = {
        type: selectedPurpose.value,
        description: selectedPurpose.value === 'external' ? externalDescription.value.trim() : 'Dùng trong công ty'
    };

    const reportData = {
        employee: selectedEmployee,
        components: selectedComponents,
        purpose: purposeData,
        implementationDate: selectedDate,
        timestamp: new Date().toISOString(),
        totalItems: Object.keys(selectedComponents).length,
        totalQuantity: Object.values(selectedComponents).reduce((sum, qty) => sum + qty, 0)
    };

    console.log('📋 Form submitted with data:', reportData);
    
    // Format date for display
    const dateDisplay = new Date(selectedDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
    });
    
    // Show success message with summary
    const componentSummary = Object.entries(selectedComponents)
        .map(([name, qty]) => `• ${name}: ${qty}`)
        .join('\n');
    
    const successMessage = `✅ Đã tạo thành công!
    
👤 ${selectedEmployee}
📦 ${reportData.totalItems} loại linh kiện
📊 Tổng SL: ${reportData.totalQuantity}
🎯 ${purposeData.description}
📅 ${dateDisplay}

${componentSummary}`;

    showSuccess(successMessage.replace(/\n/g, '<br>'));
    
    // Disable form để tránh submit duplicate
    const submitButton = form.querySelector('.btn-primary');
    submitButton.innerHTML = '<span class="btn-icon">⏳</span><span>Đang xử lý...</span>';
    submitButton.disabled = true;
    
    // Write to Google Sheets
    try {
        const writeResult = await writeToGoogleSheets(reportData);
        
        if (writeResult.success) {
            submitButton.textContent = '✅ Đã gửi';
            console.log('📝 Data written to Google Sheets:', writeResult);
            
            // Format thông tin cập nhật số lượng
            let stockUpdateInfo = '';
            if (writeResult.updatedComponents && writeResult.updatedComponents.length > 0) {
                stockUpdateInfo = '<br><br>📊 Cập nhật số lượng:<br>';
                writeResult.updatedComponents.forEach(item => {
                    stockUpdateInfo += `• ${item.name}: ${item.oldStock} → ${item.newStock} (đã dùng: ${item.usedQuantity})<br>`;
                });
            }
            
            // Show detailed success message
            const detailedSuccess = `✅ Đã lưu vào Google Sheets!
            
📋 Lưu vào sheet "Nhật ký":
• Thời gian: ${writeResult.data[0]}
• Nhân viên: ${writeResult.data[1]}  
• Ngày dùng: ${writeResult.data[2]}
• Linh kiện: ${writeResult.data[3]}
• Mục đích: ${writeResult.data[4]}
${writeResult.row ? `• Hàng số: ${writeResult.row}` : ''}${stockUpdateInfo}`;
            
            showSuccess(detailedSuccess.replace(/\n/g, '<br>'));
            
            // Refresh component data to show updated stock
            setTimeout(() => {
                console.log('🔄 Refreshing component data to show updated stock...');
                loadComponents();
            }, 2000);
            
            // Update local stock data immediately
            if (writeResult.updatedComponents) {
                writeResult.updatedComponents.forEach(item => {
                    componentStock[item.name] = item.newStock;
                    console.log(`📊 Updated local stock for ${item.name}: ${item.newStock}`);
                });
            }
        }
    } catch (error) {
        console.error('❌ Failed to write to Google Sheets:', error);
        submitButton.innerHTML = '<span class="btn-icon">❌</span><span>Lỗi kết nối</span>';
        showError(`Không kết nối được: ${error.message}<br>Kiểm tra mạng và thử lại.`);
        
        // Re-enable button for retry
        setTimeout(() => {
            submitButton.innerHTML = '<span class="btn-icon">🔄</span><span>Thử lại</span>';
            submitButton.disabled = false;
        }, 3000);
        return;
    }
    
    // Ask for new report after successful save
    setTimeout(() => {
        if (confirm('Đã lưu thành công!\n\nTạo thông tin mới?')) {
            resetForm();
        }
    }, 2000);
}

// Reset form to initial state
function resetForm() {
    // Reset employee selection
    employeeSelect.value = '';
    employeeSelect.classList.remove('success', 'error');
    
    // Reset component selection
    componentGroup.style.display = 'none';
    
    // Reset purpose selection
    purposeGroup.style.display = 'none';
    purposeCompany.checked = false;
    purposeExternal.checked = false;
    externalPurposeDetails.style.display = 'none';
    externalDescription.value = '';
    externalDescription.classList.remove('error', 'success');
    // Remove required attribute when resetting
    externalDescription.removeAttribute('required');
    
    // Remove selected class from radio options
    document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reset all checkboxes and quantity inputs
    const checkboxes = document.querySelectorAll('.component-checkbox');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    quantityInputs.forEach(input => {
        input.style.display = 'none';
        input.disabled = true;
        input.value = '';
    });
    
    // Remove selected class from all items
    const componentItems = document.querySelectorAll('.component-item');
    componentItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Collapse all groups
    const groupContents = document.querySelectorAll('.group-content');
    const groupHeaders = document.querySelectorAll('.group-header');
    const expandIcons = document.querySelectorAll('.expand-icon');
    
    groupContents.forEach(content => content.classList.remove('expanded'));
    groupHeaders.forEach(header => header.classList.remove('active'));
    expandIcons.forEach(icon => icon.classList.remove('expanded'));
    
    // Clear selected components
    selectedComponents = {};
    
    // Reset submit button
    const submitButton = form.querySelector('.btn-primary');
    submitButton.innerHTML = '<span class="btn-icon">📤</span><span>Gửi</span>';
    submitButton.disabled = false;
    
    // Clear messages
    clearMessages();
    
    console.log('🔄 Form reset to initial state');
}

// Utility functions để hiển thị loading, error, success
function showLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
    employeeSelect.disabled = show;
}

function showComponentLoading(show) {
    componentLoading.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    clearMessages();
    const errorDiv = createMessageDiv('error', message);
    insertMessage(errorDiv);
}

function showSuccess(message) {
    clearMessages();
    const successDiv = createMessageDiv('success', message);
    insertMessage(successDiv);
}

function createMessageDiv(type, message) {
    const div = document.createElement('div');
    div.className = `message message-${type}`;
    div.innerHTML = `
        <span class="message-icon">${getMessageIcon(type)}</span>
        <span class="message-text">${message}</span>
    `;
    return div;
}

function getMessageIcon(type) {
    const icons = {
        error: '❌',
        success: '✅'
    };
    return icons[type] || '❌';
}

function insertMessage(messageDiv) {
    const formGroup = document.querySelector('.form-group');
    formGroup.appendChild(messageDiv);
}

function clearMessages() {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
}

function clearError() {
    employeeSelect.classList.remove('error');
    clearMessages();
}

// Helper functions để định dạng dữ liệu cho Google Sheets
function formatDateTimeForSheet(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateForSheet(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function formatComponentsForSheet(selectedComponents, components) {
    const result = [];
    
    // Group components by their category
    const componentsByGroup = {};
    
    Object.keys(selectedComponents).forEach(componentName => {
        const quantity = selectedComponents[componentName];
        
        // Find which group this component belongs to
        let foundGroup = null;
        Object.keys(components).forEach(groupName => {
            if (components[groupName].includes(componentName)) {
                foundGroup = groupName;
            }
        });
        
        if (foundGroup) {
            if (!componentsByGroup[foundGroup]) {
                componentsByGroup[foundGroup] = [];
            }
            componentsByGroup[foundGroup].push(`${componentName} (${quantity})`);
        }
    });
    
    // Format output: Group name on separate line, components with dash prefix
    Object.keys(componentsByGroup).sort().forEach(groupName => {
        result.push(groupName);
        componentsByGroup[groupName].forEach(component => {
            result.push(`-${component}`);
        });
    });
    
    return result.join('\n');
}

// Write data to Google Sheets
async function writeToGoogleSheets(reportData) {
    try {
        console.log('📝 Writing data to Google Sheets...');
        return await writeToGoogleSheetsWithScript(reportData);
        
    } catch (error) {
        console.error('❌ Error writing to Google Sheets:', error);
        throw new Error(`Không thể lưu dữ liệu vào Google Sheets: ${error.message}`);
    }
}

// Google Apps Script function to write data (để deploy lên Google Apps Script)
/*
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = SpreadsheetApp.openById('1NGHViIVB_LYaJs5GqZ6XQ5xv3eNkex3ZjEmVn13ztNI').getSheetByName('Nhật ký');
        
        // Find next empty row
        const lastRow = sheet.getLastRow();
        const nextRow = lastRow + 1;
        
        // Write data to row
        sheet.getRange(nextRow, 1, 1, 5).setValues([data.rowData]);
        
        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            row: nextRow,
            message: 'Data written successfully'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
*/

// Alternative method using Google Apps Script Web App
async function writeToGoogleSheetsWithScript(reportData) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBqptJD9ba_m5Of1JSJcMlYaIQfaOolfjqWxRCY1tZuknbhsBxfaVBs2MiSuxpUNKo/exec';
    
    try {
        const submissionTime = formatDateTimeForSheet(new Date());
        const implementationDate = formatDateForSheet(reportData.implementationDate);
        const componentsText = formatComponentsForSheet(reportData.components, components);
        const purposeText = reportData.purpose.description;
        
        const rowData = [
            submissionTime,
            reportData.employee,
            implementationDate,
            componentsText,
            purposeText
        ];
        
        // Sử dụng GET request với URL parameters để tránh CORS
        const params = new URLSearchParams({
            action: 'addRow',
            col1: rowData[0], // Thời gian gửi
            col2: rowData[1], // Nhân viên
            col3: rowData[2], // Ngày thực hiện
            col4: rowData[3], // Linh kiện
            col5: rowData[4]  // Mục đích
        });
        
        const fullUrl = `${SCRIPT_URL}?${params.toString()}`;
        console.log('🌐 Making GET request to:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            mode: 'no-cors' // Bypass CORS for simple requests
        });
        
        console.log('📡 Response received:', response);
        
        // Với no-cors mode, chúng ta không thể đọc response content
        // Nhưng nếu không có lỗi network thì có thể coi như thành công
        return {
            success: true,
            data: rowData,
            message: 'Dữ liệu đã được gửi tới Google Sheets'
        };
        
    } catch (error) {
        console.error('Error writing with Google Apps Script:', error);
        throw error;
    }
}

// Google Sheets API methods (để sử dụng sau này với API key)
async function loadEmployeesWithAPI() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${EMPLOYEES_SHEET_NAME}!${EMPLOYEES_RANGE}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 0) {
            const employeeNames = data.values
                .map(row => row[0])
                .filter(name => name && name.trim())
                .sort((a, b) => a.localeCompare(b, 'vi'));
            
            return employeeNames;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching from Google Sheets API:', error);
        throw error;
    }
}
