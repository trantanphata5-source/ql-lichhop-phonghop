$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Đang lấy dữ liệu lịch từ Outlook..."
$scriptPath = Join-Path $PSScriptRoot "fetch_outlook.ps1"
$outputPath = Join-Path $PSScriptRoot "public\debug_events.json"

try {
    # Chạy script lấy lịch trong cùng tiến trình để giữ nguyên Encoding
    $json = . $scriptPath
    
    # Kiểm tra tính hợp lệ của JSON trước khi ghi đè
    $testParse = $json | ConvertFrom-Json
    
    # Ghi đè file JSON bằng UTF-8 chuẩn (không BOM)
    [System.IO.File]::WriteAllText($outputPath, $json, [System.Text.Encoding]::UTF8)
    Write-Host "Đã cập nhật dữ liệu mới vào: $outputPath"
    
    # Kiểm tra và tự động đẩy lên GitHub nếu có Git
    if (git rev-parse --is-inside-work-tree 2>$null) {
        Write-Host "Đang kiểm tra trạng thái Git..."
        git add public/debug_events.json
        $status = git status --porcelain public/debug_events.json
        if ($status) {
            $currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "Cập nhật dữ liệu lịch: $currentTime"
            git push
            Write-Host "Đã đẩy dữ liệu mới lên GitHub thành công!"
        } else {
            Write-Host "Không có dữ liệu mới thay đổi."
        }
    } else {
        Write-Host "Lưu ý: Thư mục chưa được khởi tạo Git hoặc chưa liên kết GitHub."
    }
} catch {
    Write-Error "Lỗi xảy ra trong quá trình cập nhật: $_"
}
