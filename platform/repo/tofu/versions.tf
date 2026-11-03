terraform {
  required_version = ">= 1.10"

  required_providers {
    opennebula = {
      source  = "opennebula/opennebula"
      version = "~> 1.5"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}
