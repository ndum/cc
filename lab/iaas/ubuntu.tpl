# Template of a small Ubuntu VM in the internal network, the template of chapter 2.4
#
#   onetemplate create ~/cc/lab/iaas/ubuntu.tpl
#   onetemplate instantiate ubuntu --name web-1

NAME        = "ubuntu"
DESCRIPTION = "Ubuntu 26.04 in the internal network"

# Capacity: CPU is the share of a physical core the scheduler reserves, VCPU what the guest sees
CPU    = "0.5"
VCPU   = "1"
MEMORY = "1024"

# The guest sees the real CPU of the node, generic models hide instructions such as AVX2
CPU_MODEL = [ MODEL = "host-passthrough" ]

DISK = [ IMAGE = "ubuntu-26.04", IMAGE_UNAME = "oneadmin" ]
NIC  = [ NETWORK = "cc-net", NETWORK_UNAME = "oneadmin", MODEL = "virtio" ]

# Contextualization: network settings, the SSH key of the user and the host name at first boot
CONTEXT = [
  NETWORK        = "YES",
  SSH_PUBLIC_KEY = "$USER[SSH_PUBLIC_KEY]",
  SET_HOSTNAME   = "$NAME"
]

GRAPHICS = [ TYPE = "VNC", LISTEN = "0.0.0.0" ]
OS       = [ ARCH = "x86_64" ]
