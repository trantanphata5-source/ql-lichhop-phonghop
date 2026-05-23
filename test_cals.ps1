$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$calendars = @()

function GetCalendars($folder) {
    foreach ($f in $folder.Folders) {
        if ($f.DefaultItemType -eq [Microsoft.Office.Interop.Outlook.OlItemType]::olAppointmentItem) {
            $calendars += $f.Name
        }
        GetCalendars $f
    }
}

foreach ($store in $namespace.Stores) {
    try {
        GetCalendars $store.GetRootFolder()
    } catch {}
}
$calendars | ConvertTo-Json
