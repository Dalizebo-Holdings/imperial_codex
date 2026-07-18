variable "region" {
  default = "af-south-1"
}

variable "cluster_name" {
  default = "imperial-citadel-eks"
}

variable "tags" {
  default = {
    Project = "Imperial-Citadel"
    Pillar  = "101"
  }
}

variable "coolify_key_pair" {
  description = "EC2 key pair name for SSH access to the Coolify server"
  type        = string
  default     = "imperial-codex-key"
}
