# Hướng dẫn triển khai Google Apps Script để ghi dữ liệu vào Google Sheets

## Bước 0: Cấu hình Google Sheets

### Cấu trúc Google Sheets cần thiết:
1. **Sheet "Nhân viên"**: Chứa danh sách nhân viên
   - Cột B: Họ và tên nhân viên

2. **Sheet "Linh kiện"**: Chứa danh sách linh kiện và số lượng
   - Cột A: Tên nhóm linh kiện
   - Cột B: Tên linh kiện
   - Cột C: Số lượng còn lại

3. **Sheet "Nhật ký"**: Nơi lưu báo cáo (sẽ được tự động tạo dữ liệu)
   - Cột A: Thời gian gửi
   - Cột B: Họ và tên
   - Cột C: Ngày thực hiện
   - Cột D: Linh kiện đã sử dụng
   - Cột E: Mục đích

## Bước 1: Tạo Google Apps Script Project

1. Truy cập [Google Apps Script](https://script.google.com/)
2. Nhấn "New Project"
3. Đặt tên project: "Component Report Logger"

## Bước 2: Cấu hình Constants

Trước khi copy code, hãy cập nhật các constants sau cho phù hợp với Google Sheets của bạn:

```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';    // ID của Google Sheets
const LOG_SHEET_NAME = 'Nhật ký';           // Tên sheet lưu báo cáo
const COMPONENT_SHEET_NAME = 'Linh kiện';    // Tên sheet chứa linh kiện
const COMPONENT_NAME_COLUMN = 2;             // Cột chứa tên linh kiện (B = 2)
const COMPONENT_STOCK_COLUMN = 3;            // Cột chứa số lượng (C = 3)
```

**Cách lấy SHEET_ID:**
- Mở Google Sheets của bạn
- Trong URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- Copy phần [SHEET_ID]

## Bước 3: Code Google Apps Script

Thay thế code mặc định bằng đoạn code sau:

```javascript
// === CẤU HÌNH CHUNG ===
// Thay đổi các giá trị này để phù hợp với Google Sheets của bạn
const SHEET_ID = '1NGHViIVB_LYaJs5GqZ6XQ5xv3eNkex3ZjEmVn13ztNI';
const LOG_SHEET_NAME = 'Nhật ký';          // Tên sheet lưu báo cáo
const COMPONENT_SHEET_NAME = 'Linh kiện';   // Tên sheet chứa danh sách linh kiện
const COMPONENT_NAME_COLUMN = 2;            // Cột B (tên linh kiện) - index bắt đầu từ 1
const COMPONENT_STOCK_COLUMN = 3;           // Cột C (số lượng còn lại) - index bắt đầu từ 1

function doGet(e) {
  try {
    // Parse parameters từ GET request
    const params = e.parameter;
    
    if (params.action === 'addRow') {
      // Mở Google Sheets
      const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(LOG_SHEET_NAME);
      const componentSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(COMPONENT_SHEET_NAME);
      
      // Ghi dữ liệu vào Nhật ký
      const lastRow = logSheet.getLastRow();
      const nextRow = lastRow + 1;
      
      const rowData = [
        params.col1, // Thời gian gửi
        params.col2, // Nhân viên  
        params.col3, // Ngày thực hiện
        params.col4, // Linh kiện
        params.col5  // Mục đích
      ];
      
      logSheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
      
      // Cập nhật số lượng trong sheet Linh kiện
      const componentText = params.col4; // Chuỗi linh kiện
      const updatedComponents = updateComponentStock(componentSheet, componentText);
      
      // Trả về kết quả thành công
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        row: nextRow,
        data: rowData,
        updatedComponents: updatedComponents,
        message: 'Dữ liệu đã được ghi thành công và số lượng đã được cập nhật'
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Test response
      return ContentService.createTextOutput('Google Apps Script is running! Use action=addRow with col1-col5 parameters.')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
  } catch (error) {
    // Trả về lỗi
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: 'Có lỗi xảy ra khi ghi dữ liệu'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateComponentStock(componentSheet, componentText) {
  const updatedComponents = [];
  
  try {
    // Parse component text để lấy danh sách linh kiện và số lượng
    // Format: "A\n-Tua vít (2)\n-Búa (1)\nB\n-Cưa (1)"
    const lines = componentText.split('\n');
    const componentsToUpdate = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-')) {
        // Đây là dòng linh kiện: "-Tua vít (2)"
        const match = line.match(/^-(.+?)\s*\((\d+)\)$/);
        if (match) {
          const componentName = match[1].trim();
          const quantity = parseInt(match[2]);
          componentsToUpdate.push({ name: componentName, quantity: quantity });
        }
      }
    }
    
    // Lấy tất cả dữ liệu từ sheet Linh kiện
    const dataRange = componentSheet.getDataRange();
    const values = dataRange.getValues();
    
    // Tìm và cập nhật từng linh kiện
    for (let i = 0; i < componentsToUpdate.length; i++) {
      const { name, quantity } = componentsToUpdate[i];
      
      // Tìm hàng chứa linh kiện này
      for (let row = 0; row < values.length; row++) {
        const componentName = values[row][COMPONENT_NAME_COLUMN - 1]; // Cột B (index 1)
        const currentStock = parseInt(values[row][COMPONENT_STOCK_COLUMN - 1]) || 0; // Cột C (index 2)
        
        if (componentName === name) {
          // Cập nhật số lượng: trừ đi số lượng đã sử dụng
          const newStock = Math.max(0, currentStock - quantity);
          componentSheet.getRange(row + 1, COMPONENT_STOCK_COLUMN).setValue(newStock);
          
          updatedComponents.push({
            name: name,
            oldStock: currentStock,
            usedQuantity: quantity,
            newStock: newStock
          });
          
          console.log(`Updated ${name}: ${currentStock} -> ${newStock} (used: ${quantity})`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error updating component stock:', error);
  }
  
  return updatedComponents;
}

function doPost(e) {
  try {
    // Parse dữ liệu từ request
    const data = JSON.parse(e.postData.contents);
    
    // Mở Google Sheets
    const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(LOG_SHEET_NAME);
    const componentSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(COMPONENT_SHEET_NAME);
    
    // Ghi dữ liệu vào Nhật ký
    const lastRow = logSheet.getLastRow();
    const nextRow = lastRow + 1;
    
    const rowData = data.rowData;
    logSheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Cập nhật số lượng trong sheet Linh kiện
    const componentText = rowData[3]; // Cột 4 - linh kiện
    const updatedComponents = updateComponentStock(componentSheet, componentText);
    
    // Trả về kết quả thành công
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      row: nextRow,
      data: rowData,
      updatedComponents: updatedComponents,
      message: 'Dữ liệu đã được ghi thành công và số lượng đã được cập nhật'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Trả về lỗi
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: 'Có lỗi xảy ra khi ghi dữ liệu'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Bước 4: Deploy Web App

1. Nhấn "Deploy" > "New deployment"
2. Chọn type: "Web app"
3. Cấu hình:
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Nhấn "Deploy"
5. Sao chép Web App URL

## Bước 5: Cập nhật JavaScript code

Trong file `script.js`, thay đổi:

```javascript
// Thay thế hàm writeToGoogleSheets bằng:
async function writeToGoogleSheets(reportData) {
    return await writeToGoogleSheetsWithScript(reportData);
}

// Cập nhật SCRIPT_URL:
const SCRIPT_URL = 'YOUR_COPIED_WEB_APP_URL_HERE';
```

## Bước 6: Test và Debug

### Test Google Apps Script trực tiếp:
1. Mở URL sau trong browser để test:
```
https://script.google.com/macros/s/AKfycbxVPyMNJeSbE7xfU4rfteVStWuKaGXqHvPd2-MIzuk27u-H0N-OaR1eIHsI3YxZDM3r/exec
```

2. Test với dữ liệu mẫu:
```
https://script.google.com/macros/s/AKfycbxVPyMNJeSbE7xfU4rfteVStWuKaGXqHvPd2-MIzuk27u-H0N-OaR1eIHsI3YxZDM3r/exec?action=addRow&col1=29/08/2025%2014:30&col2=Test%20User&col3=29/08/2025&col4=Test%20Component&col5=Test%20Purpose
```

### Debug Google Apps Script:
1. Vào Google Apps Script editor
2. Nhấn "Executions" để xem log
3. Kiểm tra lỗi trong function doGet hoặc doPost

## Bước 7: Test với ứng dụng

1. Mở file `index.html` trong browser
2. Điền form và submit
3. Kiểm tra console để xem log
4. Kiểm tra sheet "Nhật ký" để xem dữ liệu đã được ghi chưa

## Cấu hình nâng cao

### Thay đổi tên sheets:
Nếu bạn muốn dùng tên sheet khác, chỉ cần sửa constants:
```javascript
const LOG_SHEET_NAME = 'Báo cáo';          // Thay vì 'Nhật ký'
const COMPONENT_SHEET_NAME = 'Kho hàng';   // Thay vì 'Linh kiện'
```

### Thay đổi vị trí cột:
Nếu dữ liệu nằm ở cột khác:
```javascript
const COMPONENT_NAME_COLUMN = 3;     // Tên linh kiện ở cột C thay vì B
const COMPONENT_STOCK_COLUMN = 4;    // Số lượng ở cột D thay vì C
```

## Cấu trúc dữ liệu trong sheet "Nhật ký"

| Cột | Tên cột | Ví dụ dữ liệu | Mô tả |
|-----|---------|---------------|-------|
| A | Thời gian gửi | 29/08/2025 14:30 | dd/mm/yyyy h:i |
| B | Họ và tên | Nguyễn Văn A | Tên nhân viên |
| C | Ngày thực hiện | 29/08/2025 | dd/mm/yyyy |
| D | Linh kiện | Nhóm A: Tua vít (2), Búa (1) \| Nhóm B: Cưa (1) | Nhóm -> linh kiện (số lượng) |
| E | Mục đích | Sử dụng cho dự án ABC | Mục đích sử dụng |

## Troubleshooting

### Lỗi CORS
- Đảm bảo Web App được deploy với "Who has access: Anyone"
- Kiểm tra URL đã chính xác chưa

### Lỗi Permission
- Chạy script một lần để authorize permissions
- Kiểm tra quyền truy cập Google Sheets

### Lỗi Sheet không tồn tại
- Đảm bảo sheet "Nhật ký" đã được tạo trong Google Sheets
- Kiểm tra SHEET_ID đã chính xác

## Security Notes

- Web App URL chứa token bảo mật
- Không share URL này công khai
- Có thể hạn chế access bằng cách thay đổi "Who has access"
