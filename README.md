# 📋 Component Usage Report System

Hệ thống báo cáo sử dụng linh kiện - Thay thế Google Form với nhiều tính năng tiện lợi hơn.

## 🎯 Mục đích

Tạo giao diện form thân thiện cho nhân viên nhập báo cáo số lượng linh kiện sử dụng, tích hợp với Google Sheets để quản lý dữ liệu.

## 📁 Cấu trúc project

```
Component-Usage-Report-System/
├── index.html          # Giao diện chính
├── styles.css          # Stylesheet
├── script.js           # Logic xử lý
└── README.md          # Tài liệu hướng dẫn
```

## 🚀 Tính năng hiện tại

### ✅ Bước 1: Chọn nhân viên
- Select box hiển thị danh sách nhân viên từ Google Sheets
- Lấy dữ liệu từ sheet "Nhân viên", cột B (B2:B)
- Tự động refresh danh sách
- Validation và thông báo lỗi
- Fallback với dữ liệu mẫu khi không kết nối được

### ✅ Bước 2: Chọn linh kiện
- Accordion interface để chọn linh kiện theo nhóm
- Lấy dữ liệu từ sheet "Linh kiện" (cột A: nhóm, cột B: tên linh kiện)
- Checkbox để chọn/bỏ chọn linh kiện
- Input số lượng cho mỗi linh kiện đã chọn
- Validation số lượng > 0

### ✅ Bước 3: Chọn mục đích sử dụng
- Radio buttons: "Sử dụng trong công ty" vs "Sử dụng bên ngoài"
- Text area mô tả chi tiết khi chọn "bên ngoài"
- Validation mô tả tối thiểu 10 ký tự

### ✅ Bước 4: Chọn ngày thực hiện
- Date picker với validation
- Không cho phép chọn ngày trong tương lai
- Mặc định là ngày hiện tại

### ✅ Bước 5: Lưu dữ liệu vào Google Sheets
- Tự động ghi vào sheet "Nhật ký"
- Tìm hàng trống đầu tiên để ghi
- Format dữ liệu theo yêu cầu:
  - Cột A: Thời gian gửi (dd/mm/yyyy h:i)
  - Cột B: Họ và tên
  - Cột C: Ngày thực hiện (dd/mm/yyyy)
  - Cột D: Linh kiện theo nhóm (Nhóm A: item1 (qty), item2 (qty))
  - Cột E: Mục đích sử dụng

## 🔗 Kết nối Google Sheets

### Sheets được sử dụng:
- **Sheet ID**: `1NGHViIVB_LYaJs5GqZ6XQ5xv3eNkex3ZjEmVn13ztNI`
- **Nhân viên**: Sheet "Nhân viên", cột B2:B (họ tên)
- **Linh kiện**: Sheet "Linh kiện", cột A2:B (nhóm, tên linh kiện)
- **Nhật ký**: Sheet "Nhật ký", cột A:E (dữ liệu báo cáo)

### Cách hoạt động:
1. **Đọc dữ liệu**: Sử dụng Google Sheets CSV export URL
2. **Ghi dữ liệu**: Sử dụng Google Apps Script Web App
3. **Fallback**: Dữ liệu mẫu khi không kết nối được

### Triển khai Google Apps Script:
Xem file `google-apps-script-setup.md` để hướng dẫn chi tiết cách thiết lập ghi dữ liệu vào Google Sheets.

## 📖 Hướng dẫn sử dụng

### 1. Mở file
```bash
# Mở index.html trong trình duyệt
open index.html
```

### 2. Chọn nhân viên
- Click vào dropdown "Chọn nhân viên..."
- Chọn tên nhân viên từ danh sách
- Click "Tiếp tục" để chuyển bước tiếp theo

### 3. Refresh danh sách
- Click nút "🔄 Làm mới danh sách" để tải lại từ Google Sheets

## 🛠️ Phát triển tiếp theo

### Bước 2: Thông tin linh kiện
- [ ] Thêm trường chọn loại linh kiện
- [ ] Nhập số lượng sử dụng
- [ ] Ghi chú bổ sung

### Bước 3: Xác nhận và gửi
- [ ] Preview thông tin đã nhập
- [ ] Gửi dữ liệu lên Google Sheets
- [ ] Thông báo thành công

### Tính năng nâng cao
- [ ] Dark mode
- [ ] Offline support
- [ ] Export PDF báo cáo
- [ ] Multi-language support
- [ ] Mobile app

## 🔧 Cấu hình Google Sheets API

Để sử dụng Google Sheets API (tùy chọn):

1. Tạo project tại [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sheets API
3. Tạo API key
4. Thay thế `YOUR_GOOGLE_SHEETS_API_KEY` trong `script.js`

## 🎨 Thiết kế

- **Framework**: Vanilla HTML/CSS/JavaScript
- **Design**: Modern, responsive, gradient colors
- **UX**: User-friendly với animations và feedback
- **Mobile**: Responsive design cho mobile devices

## 📱 Responsive Design

- Desktop: Full layout với sidebar
- Tablet: Responsive grid
- Mobile: Single column, full width buttons

## 🌟 Tính năng UI/UX

- ✨ Smooth animations
- 🎨 Gradient backgrounds
- 📱 Mobile responsive
- 🔄 Loading indicators
- ✅ Success/Error messages
- 🎯 Focus management
- ♿ Accessibility friendly

## 🐛 Troubleshooting

### Không tải được danh sách nhân viên
1. Kiểm tra Google Sheets có public access
2. Thử click "Làm mới danh sách"
3. Sẽ tự động fallback sang dữ liệu mẫu

### Lỗi CORS
- Google Sheets CSV export thường không bị CORS
- Nếu gặp lỗi, có thể cần setup proxy server

## 📞 Liên hệ

Tạo bởi AI Assistant để hỗ trợ quản lý báo cáo linh kiện hiệu quả hơn.
