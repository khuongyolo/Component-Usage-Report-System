// Cấu hình Google Sheets API - giống với trang chính
const SHEET_ID = '1NGHViIVB_LYaJs5GqZ6XQ5xv3eNkex3ZjEmVn13ztNI';
const API_KEY = 'YOUR_GOOGLE_SHEETS_API_KEY';
const EMPLOYEES_SHEET_NAME = 'Nhân viên';
const EMPLOYEES_RANGE = 'B2:B';
const COMPONENTS_SHEET_NAME = 'Linh kiện';
const COMPONENTS_RANGE = 'A2:C';
const LOG_SHEET_NAME = 'Nhật ký cập nhật'; // Sheet riêng cho việc cập nhật kho

// Trạng thái ứng dụng
let components = {};
let componentStock = {};
let selectedComponents = {}; // Object chứa linh kiện đã chọn và số lượng cần THÊM
let isLoadingComponents = false;

// DOM elements
const form = document.getElementById('stockUpdateForm');
const componentGroup = document.getElementById('componentGroup');
const componentLoading = document.getElementById('componentLoading');
const componentAccordion = document.getElementById('componentAccordion');

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Stock Update System initialized');
    
    loadComponents();
    setupEventListeners();
    
    // Show component group immediately
    showComponentGroup();
});

// Thiết lập event listeners
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });
}

// Load danh sách linh kiện (code giống trang chính)
async function loadComponents() {
    if (isLoadingComponents) return;

    isLoadingComponents = true;
    showComponentLoading(true);

    try {
        console.log('📦 Loading components from Google Sheets...');
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COMPONENTS_SHEET_NAME)}&range=${COMPONENTS_RANGE}`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
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

// Parse CSV components (code giống trang chính)
function parseCSVComponents(csvData) {
    const lines = csvData.trim().split('\n');
    const componentGroups = {};
    const groupOrder = [];
    const stockData = {};
    let currentGroup = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
            const groupCell = parts[0];
            const componentCell = parts[1];
            const stockCell = parts[2];
            
            if (groupCell === 'Nhóm' || componentCell === 'Linh kiện') {
                continue;
            }
            
            if (groupCell && groupCell.trim() !== '') {
                currentGroup = groupCell.trim();
                
                if (!componentGroups[currentGroup]) {
                    componentGroups[currentGroup] = [];
                    groupOrder.push(currentGroup);
                }
            }
            
            if (componentCell && componentCell.trim() !== '' && currentGroup) {
                const componentName = componentCell.trim();
                const stockQuantity = parseInt(stockCell) || 0;
                
                componentGroups[currentGroup].push(componentName);
                stockData[componentName] = stockQuantity;
            }
        }
    }
    
    componentStock = stockData;
    componentGroups._order = groupOrder;
    
    return componentGroups;
}

// Show component group
function showComponentGroup() {
    console.log('👀 Showing component selection step');
    componentGroup.style.display = 'block';
    componentGroup.classList.add('active');
    
    if (Object.keys(components).length > 0) {
        componentAccordion.style.display = 'block';
    }
}

// Populate component accordion (code giống trang chính)
function populateComponentAccordion(componentGroups) {
    componentAccordion.innerHTML = '';
    
    const groupOrder = componentGroups._order || Object.keys(componentGroups);
    groupOrder.forEach(group => {
        if (group !== '_order' && componentGroups[group]) {
            const groupElement = createComponentGroup(group, componentGroups[group]);
            componentAccordion.appendChild(groupElement);
        }
    });
    
    componentAccordion.style.display = 'block';
}

// Create component group (code giống trang chính)
function createComponentGroup(groupName, groupComponents) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'component-group';
    groupDiv.dataset.group = groupName;

    const header = document.createElement('div');
    header.className = 'group-header';
    header.onclick = () => toggleGroup(groupName);
    
    header.innerHTML = `
        <div class="group-title">
            <div class="group-main">
                <span class="group-icon">📦</span>
                <span class="group-name">${groupName}</span>
            </div>
            <div class="group-info">(${groupComponents.length} linh kiện)</div>
        </div>
        <span class="expand-icon">⌄</span>
    `;

    const content = document.createElement('div');
    content.className = 'group-content';
    content.id = `group-content-${groupName}`;

    const componentList = document.createElement('div');
    componentList.className = 'component-list';

    groupComponents.forEach((componentName, index) => {
        const componentItem = createComponentItem(componentName, groupName, index);
        componentList.appendChild(componentItem);
    });

    content.appendChild(componentList);
    groupDiv.appendChild(header);
    groupDiv.appendChild(content);

    return groupDiv;
}

// Toggle group (code giống trang chính)
function toggleGroup(groupName) {
    const header = document.querySelector(`[data-group="${groupName}"] .group-header`);
    const content = document.getElementById(`group-content-${groupName}`);
    const expandIcon = header.querySelector('.expand-icon');

    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        content.classList.remove('expanded');
        header.classList.remove('active');
        expandIcon.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        header.classList.add('active');
        expandIcon.classList.add('expanded');
    }
}

// Create component item - KHÁC với trang chính (không disable khi hết hàng)
function createComponentItem(componentName, groupName, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'component-item';
    itemDiv.dataset.component = componentName;
    itemDiv.dataset.group = groupName;

    const checkboxId = `component_${groupName}_${index}`;
    const quantityId = `quantity_${groupName}_${index}`;
    const stockQuantity = componentStock[componentName] || 0;
    
    // Không disable cho việc cập nhật kho
    const stockDisplay = `Hiện có: ${stockQuantity}`;

    itemDiv.innerHTML = `
        <label for="${checkboxId}" class="component-info-label">
            <div class="component-info">
                <div class="component-main">
                    <input type="checkbox" 
                           id="${checkboxId}" 
                           class="component-checkbox" 
                           value="${componentName}"
                           onchange="handleComponentCheck(this, '${componentName}', '${quantityId}')">
                    <span class="component-name">
                        ${componentName}
                    </span>
                </div>
                <div class="stock-info in-stock">${stockDisplay}</div>
            </div>
        </label>
        <input type="number" 
               id="${quantityId}" 
               class="quantity-input" 
               placeholder="Số lượng thêm" 
               min="1"
               disabled
               style="display: none;"
               onchange="handleQuantityChange(this, '${componentName}')">
    `;

    return itemDiv;
}

// Handle component checkbox - KHÁC: placeholder "Số lượng thêm"
function handleComponentCheck(checkbox, componentName, quantityId) {
    const quantityInput = document.getElementById(quantityId);
    const componentItem = checkbox.closest('.component-item');

    if (checkbox.checked) {
        quantityInput.style.display = 'block';
        quantityInput.disabled = false;
        quantityInput.focus();
        quantityInput.value = '1';
        componentItem.classList.add('selected');
        
        selectedComponents[componentName] = 1;
        
        console.log(`✅ Selected component for update: ${componentName}`);
    } else {
        quantityInput.style.display = 'none';
        quantityInput.disabled = true;
        quantityInput.value = '';
        componentItem.classList.remove('selected');
        
        delete selectedComponents[componentName];
        
        console.log(`❌ Deselected component: ${componentName}`);
    }
}

// Handle quantity change - KHÁC: không có giới hạn max
function handleQuantityChange(input, componentName) {
    const quantity = parseInt(input.value);
    
    if (quantity && quantity > 0) {
        selectedComponents[componentName] = quantity;
        console.log(`📊 Updated add quantity for ${componentName}: ${quantity}`);
    } else {
        input.value = '1';
        selectedComponents[componentName] = 1;
    }
}

// Handle form submission - KHÁC: CỘNG vào thay vì trừ, không cần employee
async function handleFormSubmit() {
    // Validate component selection
    if (Object.keys(selectedComponents).length === 0) {
        showError('Vui lòng chọn ít nhất 1 linh kiện để cập nhật.');
        const firstGroupHeader = document.querySelector('.group-header');
        if (firstGroupHeader) {
            firstGroupHeader.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    const updateData = {
        components: selectedComponents,
        timestamp: new Date().toISOString(),
        totalItems: Object.keys(selectedComponents).length,
        totalQuantity: Object.values(selectedComponents).reduce((sum, qty) => sum + qty, 0),
        action: 'ADD' // Đánh dấu đây là action thêm vào kho
    };

    console.log('📋 Stock update submitted with data:', updateData);
    
    // Format date for display
    const currentTime = formatDateTimeForSheet(new Date());
    
    // Disable form để tránh submit duplicate
    const submitButton = form.querySelector('.btn-primary');
    submitButton.innerHTML = '<span class="btn-icon">⏳</span><span>Đang xử lý...</span>';
    submitButton.disabled = true;
    
    // Write to Google Sheets với action ADD
    try {
        const writeResult = await writeStockUpdateToGoogleSheets(updateData);
        
        if (writeResult.success) {
            submitButton.textContent = '✅ Đã cập nhật';
            console.log('📝 Stock update written to Google Sheets:', writeResult);
            
            // Refresh component data
            setTimeout(() => {
                console.log('🔄 Refreshing component data...');
                loadComponents();
            }, 2000);
            
            // Update local stock data
            if (writeResult.updatedComponents) {
                writeResult.updatedComponents.forEach(item => {
                    componentStock[item.name] = item.newStock;
                });
            }
        }
    } catch (error) {
        console.error('❌ Failed to write stock update:', error);
        submitButton.innerHTML = '<span class="btn-icon">❌</span><span>Lỗi kết nối</span>';
        showError(`Không kết nối được: ${error.message}`);
        
        setTimeout(() => {
            submitButton.innerHTML = '<span class="btn-icon">🔄</span><span>Thử lại</span>';
            submitButton.disabled = false;
        }, 3000);
        return;
    }
    
    // Ask for new update
    setTimeout(() => {
        if (confirm('Đã cập nhật thành công!\n\nCập nhật thêm linh kiện khác?')) {
            resetForm();
        }
    }, 2000);
}

// Reset form
function resetForm() {
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
    
    const componentItems = document.querySelectorAll('.component-item');
    componentItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    const groupContents = document.querySelectorAll('.group-content');
    const groupHeaders = document.querySelectorAll('.group-header');
    const expandIcons = document.querySelectorAll('.expand-icon');
    
    groupContents.forEach(content => content.classList.remove('expanded'));
    groupHeaders.forEach(header => header.classList.remove('active'));
    expandIcons.forEach(icon => icon.classList.remove('expanded'));
    
    selectedComponents = {};
    
    const submitButton = form.querySelector('.btn-primary');
    submitButton.innerHTML = '<span class="btn-icon">📦</span><span>Cập nhật kho</span>';
    submitButton.disabled = false;
    
    clearMessages();
}

// Utility functions
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

// Helper functions để định dạng dữ liệu
function formatDateTimeForSheet(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateForSheet(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function formatComponentsForSheet(selectedComponents, components) {
    const result = [];
    
    const componentsByGroup = {};
    
    Object.keys(selectedComponents).forEach(componentName => {
        const quantity = selectedComponents[componentName];
        
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
            componentsByGroup[foundGroup].push(`${componentName} (+${quantity})`);
        }
    });
    
    Object.keys(componentsByGroup).sort().forEach(groupName => {
        result.push(groupName);
        componentsByGroup[groupName].forEach(component => {
            result.push(`-${component}`);
        });
    });
    
    return result.join('\n');
}

// Write stock update to Google Sheets - Ghi vào sheet "Nhật ký cập nhật" với format đơn giản
async function writeStockUpdateToGoogleSheets(updateData) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7SgfzV4MKsOk2WL6BzVZEwVzcmZDuwNgnViAZby9mRjXZv8rXht1QaSIQBe1Mj5-MuA/exec';
    
    try {
        const submissionTime = formatDateTimeForSheet(new Date());
        const componentsText = formatComponentsForSheet(updateData.components, components);
        
        // Format đơn giản:
        // Cột 1: thời gian gửi form
        // Cột 2: chi tiết linh kiện được bổ sung
        const rowData = [
            submissionTime,           // Cột 1: Thời gian gửi form
            componentsText           // Cột 2: Chi tiết linh kiện được bổ sung
        ];
        
        const params = new URLSearchParams({
            action: 'addStockUpdate', // Action riêng để ghi vào sheet "Nhật ký cập nhật"
            col1: rowData[0],
            col2: rowData[1]
        });
        
        const fullUrl = `${SCRIPT_URL}?${params.toString()}`;
        console.log('🌐 Making stock update request to:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        return {
            success: true,
            data: rowData,
            message: 'Cập nhật kho đã được ghi vào sheet "Nhật ký cập nhật"'
        };
        
    } catch (error) {
        console.error('Error writing stock update:', error);
        throw error;
    }
}
