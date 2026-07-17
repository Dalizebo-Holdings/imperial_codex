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
