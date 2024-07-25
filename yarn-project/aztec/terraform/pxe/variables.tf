variable "DEPLOY_TAG" {
  type = string
}

variable "IMAGE_TAG" {
  type    = string
  default = "latest"
}

variable "DOCKERHUB_ACCOUNT" {
  type = string
}

variable "API_KEY" {
  type = string
}
