#Requires -RunAsAdministrator
<#
  Creates the three VMs of the CC lab in Hyper-V with nested virtualisation.

  Run it in a PowerShell as administrator, with your personal code and the Ubuntu 26.04 server ISO:
    powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"

  The script can run again, a switch, NAT or VM that already exists stays as it is.
#>
param(
  [Parameter(Mandatory = $true)][string]$Code,
  [Parameter(Mandatory = $true)][string]$Iso,
  [string]$VmPath = "$env:PUBLIC\Documents\Hyper-V\cc-lab",
  [string]$SwitchName = 'CC-Lab',
  # The lab network of the three VMs, the host takes .1 and the VMs .10 to .12
  [string]$Prefix = '192.168.42',
  [int64]$NodeMemoryGB = 8
)

$ErrorActionPreference = 'Stop'
if ($Code -notmatch '^[a-z][a-z0-9]{1,15}$') { throw 'The code starts with a letter and has 2 to 16 lower case letters or digits.' }
if (-not (Test-Path $Iso)) { throw "ISO not found: $Iso" }

# An internal switch with NAT keeps the addresses stable, the Default Switch changes its subnet after a restart
if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
  New-VMSwitch -Name $SwitchName -SwitchType Internal | Out-Null
  $ifIndex = (Get-NetAdapter -Name "vEthernet ($SwitchName)").ifIndex
  New-NetIPAddress -IPAddress "$Prefix.1" -PrefixLength 24 -InterfaceIndex $ifIndex | Out-Null
}
if (-not (Get-NetNat -Name $SwitchName -ErrorAction SilentlyContinue)) {
  New-NetNat -Name $SwitchName -InternalIPInterfaceAddressPrefix "$Prefix.0/24" | Out-Null
}

$vms = @(
  @{ Name = "$Code-fe";    MemoryGB = 16;            DiskGB = 100; Ip = "$Prefix.10" },
  @{ Name = "$Code-node1"; MemoryGB = $NodeMemoryGB; DiskGB = 50;  Ip = "$Prefix.11" },
  @{ Name = "$Code-node2"; MemoryGB = $NodeMemoryGB; DiskGB = 50;  Ip = "$Prefix.12" }
)

New-Item -ItemType Directory -Force -Path $VmPath | Out-Null
foreach ($vm in $vms) {
  if (Get-VM -Name $vm.Name -ErrorAction SilentlyContinue) { Write-Host "$($vm.Name) exists, skipped"; continue }
  New-VM -Name $vm.Name -Generation 2 -Path $VmPath -MemoryStartupBytes ($vm.MemoryGB * 1GB) `
    -NewVHDPath (Join-Path $VmPath "$($vm.Name).vhdx") -NewVHDSizeBytes ($vm.DiskGB * 1GB) -SwitchName $SwitchName | Out-Null
  # Nested virtualisation needs static memory and the virtualisation extensions of the CPU
  Set-VMMemory -VMName $vm.Name -DynamicMemoryEnabled $false
  Set-VMProcessor -VMName $vm.Name -Count 4 -ExposeVirtualizationExtensions $true
  # Ubuntu starts with Secure Boot only with the template for third-party systems
  Set-VMFirmware -VMName $vm.Name -SecureBootTemplate MicrosoftUEFICertificateAuthority
  Add-VMDvdDrive -VMName $vm.Name -Path $Iso
  Set-VMFirmware -VMName $vm.Name -FirstBootDevice (Get-VMDvdDrive -VMName $vm.Name)
  Set-VM -Name $vm.Name -AutomaticCheckpointsEnabled $false -CheckpointType Standard -AutomaticStopAction ShutDown
  Write-Host "$($vm.Name) created"
}

Write-Host ''
Write-Host "Addresses for the Ubuntu installer (subnet $Prefix.0/24, gateway $Prefix.1, DNS 9.9.9.9):"
foreach ($vm in $vms) { Write-Host ("  {0,-20} {1}" -f $vm.Name, $vm.Ip) }
