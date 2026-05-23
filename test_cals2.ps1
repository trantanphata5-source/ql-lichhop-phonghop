$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$defaultCalendar = $namespace.GetDefaultFolder(9)
$result = @()
foreach ($folder in $defaultCalendar.Folders) {
    $result += $folder.Name
}
$result | ConvertTo-Json
