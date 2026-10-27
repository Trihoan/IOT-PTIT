$ErrorActionPreference = 'Stop'
Start-Transcript -Path (Join-Path $PSScriptRoot 'mqtt-setup.log') -Append | Out-Null
$brokerDirectory = 'C:\Program Files\mosquitto'
$sourceConfig = Join-Path $brokerDirectory 'hoan.conf'
$serviceConfig = Join-Path $brokerDirectory 'mosquitto.conf'
$passwordFile = Join-Path $brokerDirectory 'passwd'
$backupSuffix = '.backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')

if (!(Test-Path -LiteralPath $passwordFile)) { throw 'MQTT password file is missing.' }
$configuration = Get-Content -LiteralPath $sourceConfig -Raw
if ($configuration -notmatch '(?m)^\s*listener\s+1883\s+0\.0\.0\.0\s*$') {
  throw 'hoan.conf must contain listener 1883 0.0.0.0.'
}
$configuration = [regex]::Replace($configuration, '(?m)^\s*password_file\s+[^\r\n]+', "password_file $passwordFile")
Copy-Item -LiteralPath $sourceConfig -Destination ($sourceConfig + $backupSuffix)
Copy-Item -LiteralPath $serviceConfig -Destination ($serviceConfig + $backupSuffix)
try {
  Set-Content -LiteralPath $sourceConfig -Value $configuration -Encoding Ascii
  # The Windows service reads mosquitto.conf, rather than hoan.conf.
  Set-Content -LiteralPath $serviceConfig -Value $configuration -Encoding Ascii
  # Mosquitto runs as LocalSystem; mosquitto_passwd can create an admin-only file.
  & icacls.exe $passwordFile /grant '*S-1-5-18:(R)'
  if ($LASTEXITCODE -ne 0) { throw 'Cannot grant the broker service read access to its password file.' }
  Restart-Service mosquitto
  Start-Sleep -Seconds 2
  if ((Get-Service mosquitto).Status -ne 'Running') { throw 'Mosquitto stopped after startup.' }
  $ruleName = 'IOT-MQTT-LocalSubnet'
  if (!(Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name $ruleName -DisplayName 'IoT MQTT from local subnet' -Direction Inbound -Protocol TCP -LocalPort 1883 -RemoteAddress LocalSubnet -Action Allow | Out-Null
  }
  Get-Service mosquitto
  netstat -ano -p tcp | Select-String ':1883'
} catch {
  Copy-Item -LiteralPath ($sourceConfig + $backupSuffix) -Destination $sourceConfig
  Copy-Item -LiteralPath ($serviceConfig + $backupSuffix) -Destination $serviceConfig
  Restart-Service mosquitto -ErrorAction SilentlyContinue
  throw
}
