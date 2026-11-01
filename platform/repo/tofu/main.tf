# Two VMs in cc-net with k3s, server and agent, the code of chapter 4.2 and 4.3

# User and password come from OPENNEBULA_USERNAME and OPENNEBULA_PASSWORD
provider "opennebula" {
  endpoint = var.endpoint
}

# The agent joins the server with this token, it lives only in the state
resource "random_password" "k3s_token" {
  length  = 48
  special = false
}

locals {
  nodes = {
    "k3s-server" = { ip = var.server_ip, role = "server" }
    "k3s-agent"  = { ip = var.agent_ip, role = "agent" }
  }
}

data "opennebula_virtual_network" "cc_net" {
  name = "cc-net"
}

data "opennebula_image" "ubuntu" {
  name = "ubuntu-26.04"
}

resource "opennebula_virtual_machine" "k3s" {
  for_each = local.nodes

  name   = each.key
  cpu    = 1
  vcpu   = 4
  memory = var.memory

  # Without the real CPU of the node the guest lacks AVX2, which slows down the local model of part 5
  cpumodel {
    model = "host-passthrough"
  }

  context = {
    NETWORK        = "YES"
    SET_HOSTNAME   = "$NAME"
    SSH_PUBLIC_KEY = "$USER[SSH_PUBLIC_KEY]"
    START_SCRIPT_BASE64 = base64encode(templatefile("${path.module}/k3s.sh.tftpl", {
      role        = each.value.role
      ip          = each.value.ip
      server_ip   = var.server_ip
      token       = random_password.k3s_token.result
      k3s_version = var.k3s_version
    }))
  }

  # OpenNebula sets the machine type q35 itself, without it here every plan would show a change
  os {
    arch    = "x86_64"
    boot    = "disk0"
    machine = "q35"
  }

  disk {
    image_id = data.opennebula_image.ubuntu.id
    size     = var.disk_size
    target   = "vda"
  }

  nic {
    network_id = data.opennebula_virtual_network.cc_net.id
    ip         = each.value.ip
    model      = "virtio"
  }

  graphics {
    type   = "VNC"
    listen = "0.0.0.0"
  }
}
