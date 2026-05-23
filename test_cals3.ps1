$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$calendar = $namespace.GetDefaultFolder(9)
$parent = $calendar.Parent
$result = @()
foreach ($f in $parent.Folders) {
    if ($f.DefaultItemType -eq 1) {
        $result += $f.Name
    }
}
$result | ConvertTo-Json
