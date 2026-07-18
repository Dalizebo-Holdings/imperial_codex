# Coolify self-hosted deployment server

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_vpc" "coolify" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags                 = merge(var.tags, { Name = "coolify-vpc" })
}

resource "aws_internet_gateway" "coolify" {
  vpc_id = aws_vpc.coolify.id
  tags   = merge(var.tags, { Name = "coolify-igw" })
}

resource "aws_subnet" "coolify" {
  vpc_id                  = aws_vpc.coolify.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  tags                    = merge(var.tags, { Name = "coolify-subnet" })
}

resource "aws_route_table" "coolify" {
  vpc_id = aws_vpc.coolify.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.coolify.id
  }
  tags = merge(var.tags, { Name = "coolify-rt" })
}

resource "aws_route_table_association" "coolify" {
  subnet_id      = aws_subnet.coolify.id
  route_table_id = aws_route_table.coolify.id
}

resource "aws_security_group" "coolify" {
  name   = "coolify-sg"
  vpc_id = aws_vpc.coolify.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Coolify UI"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = var.tags
}

resource "aws_instance" "coolify" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.coolify.id
  vpc_security_group_ids = [aws_security_group.coolify.id]
  key_name               = var.coolify_key_pair

  root_block_device {
    volume_size = 40
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
  EOF

  tags = merge(var.tags, { Name = "coolify-server" })
}

resource "aws_eip" "coolify" {
  instance = aws_instance.coolify.id
  domain   = "vpc"
  tags     = merge(var.tags, { Name = "coolify-eip" })
}
