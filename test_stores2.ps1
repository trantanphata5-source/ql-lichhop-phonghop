$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")

$result = @()
foreach ($store in $namespace.Stores) {
    $result += $store.DisplayName
}
$result | ConvertTo-Json
