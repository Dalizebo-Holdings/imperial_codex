# Free-tier: S3 bucket for instrument document storage
resource "aws_s3_bucket" "instruments" {
  bucket = "imperial-codex-instruments"
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "instruments" {
  bucket = aws_s3_bucket.instruments.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "instruments" {
  bucket = aws_s3_bucket.instruments.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "instruments" {
  bucket                  = aws_s3_bucket.instruments.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM user for app access to S3
resource "aws_iam_user" "app" {
  name = "imperial-codex-app"
  tags = var.tags
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

resource "aws_iam_user_policy" "app_s3" {
  name = "imperial-codex-s3-policy"
  user = aws_iam_user.app.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.instruments.arn,
        "${aws_s3_bucket.instruments.arn}/*"
      ]
    }]
  })
}
