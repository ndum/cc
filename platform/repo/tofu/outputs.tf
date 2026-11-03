output "ips" {
  description = "Addresses of the k3s VMs"
  value       = { for name, vm in opennebula_virtual_machine.k3s : name => vm.nic[0].computed_ip }
}

output "api" {
  description = "Kubernetes API of the cluster"
  value       = "https://${var.server_ip}:6443"
}
