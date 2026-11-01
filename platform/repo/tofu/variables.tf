variable "endpoint" {
  description = "XML-RPC endpoint of OpenNebula, the front-end itself"
  type        = string
  default     = "http://localhost:2633/RPC2"
}

variable "server_ip" {
  description = "Address of the k3s server in cc-net, CC_K3S_SERVER_IP of the personal parameters"
  type        = string
}

variable "agent_ip" {
  description = "Address of the k3s agent in cc-net, CC_K3S_AGENT_IP of the personal parameters"
  type        = string
}

variable "k3s_version" {
  description = "k3s release, pinned so that a rebuild gives the same cluster"
  type        = string
  default     = "v1.36.5+k3s1"
}

variable "memory" {
  description = "Memory of each k3s VM in MB, part 5 needs 6 GB for monitoring, logs and the local model"
  type        = number
  default     = 6144
}
