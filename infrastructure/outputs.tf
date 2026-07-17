output "s3_bucket_name" {
  value = aws_s3_bucket.instruments.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.instruments.arn
}

output "app_access_key_id" {
  value = aws_iam_access_key.app.id
}

output "app_secret_access_key" {
  value     = aws_iam_access_key.app.secret
  sensitive = true
}
