# Amazon Q CLI Setup Guide

## Overview
Amazon Q is an AI-powered assistant that helps developers write, understand, and refine code within VS Code. This repository is now configured to work with Amazon Q CLI for enhanced development productivity.

## Prerequisites

- AWS Account with Amazon Q access
- AWS CLI installed (`aws --version` to check)
- VS Code installed with Amazon Q extension
- Node.js 18+ installed

## Setup Steps

### 1. Install AWS CLI
If you haven't already installed AWS CLI, download it from:
https://aws.amazon.com/cli/

Verify installation:
```bash
aws --version
```

### 2. Configure AWS Credentials
Your AWS credentials are stored in `~/.aws/credentials` and `~/.aws/config`.

**Location:**
- Windows: `C:\Users\<YourUsername>\.aws\credentials`
- Mac/Linux: `~/.aws/credentials`

**Ensure credentials exist:**
The `[amazon-q]` profile should be configured with your AWS credentials that have Amazon Q permissions.

### 3. Install Amazon Q VS Code Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Amazon Q"
4. Install "Amazon Q" by Amazon Web Services (amazonwebservices.amazon-q-vscode)
5. VS Code will recommend this extension when opening this workspace

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Amazon Q settings:
```env
AWS_PROFILE=amazon-q
AWS_REGION=us-east-1
AMAZON_Q_DEV_MODE=false
AMAZON_Q_SHARE_USAGE_DATA=true
```

### 5. Authenticate with Amazon Q

After installing the extension, you'll be prompted to authenticate:

1. When you open VS Code, the Amazon Q extension will prompt you to sign in
2. Click "Sign in with AWS" or "Authenticate"
3. You'll be directed to AWS login in your browser
4. After successful authentication, return to VS Code
5. The extension should confirm you're authenticated

## Using Amazon Q

### NPM Scripts
The following npm scripts are available for Amazon Q CLI operations:

```bash
npm run q:help      # Display Amazon Q CLI help
npm run q:chat      # Start Amazon Q chat session
npm run q:code      # Get code suggestions from Amazon Q
npm run q:scan      # Scan code for security/quality issues
npm run q:explain   # Get explanations for code
```

### In VS Code

- **Chat**: Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P) and search for "Amazon Q: New Chat"
- **Code Suggestions**: Amazon Q provides inline suggestions as you type
- **Documentation**: Hover over symbols to see Amazon Q documentation
- **Refactoring**: Highlight code and ask Amazon Q to refactor or optimize it
- **Testing**: Ask Amazon Q to generate test cases for your code

## Workspace Configuration

The following VS Code settings are configured for Amazon Q:

**`.vscode/settings.json`:**
- Amazon Q profile: `amazon-q`
- AWS Region: `us-east-1`
- Telemetry: Enabled (can be disabled)
- Dev Mode: Disabled (enable for debugging)

**`.vscode/launch.json`:**
- Debug configurations for Next.js dev server
- Jest test runner with Amazon Q support

**`.vscode/extensions.json`:**
- Recommended extensions including Amazon Q

## Troubleshooting

### Authentication Issues

**Problem:** "Not authenticated" message in Amazon Q

**Solution:**
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search for "Amazon Q: Sign in"
3. Click and complete the authentication flow
4. Verify AWS credentials are properly configured

### AWS Credentials Not Found

**Problem:** "AWS credentials not found"

**Solution:**
1. Verify credentials exist: `aws s3 ls`
2. Check profile: `AWS_PROFILE=amazon-q aws sts get-caller-identity`
3. Ensure `[amazon-q]` profile is in `~/.aws/credentials`
4. Ensure region is in `~/.aws/config` for the profile

### Extension Not Loading

**Problem:** Amazon Q extension not activating

**Solution:**
1. Uninstall the extension (Ctrl+Shift+X / Cmd+Shift+X)
2. Reinstall "Amazon Q" by AWS
3. Reload VS Code (Ctrl+Shift+P / Cmd+Shift+P → "Reload Window")

## AWS Permissions Required

Amazon Q requires the following AWS permissions:

- `codewhisperer:CreateAccessToken`
- `codewhisperer:GetAccessToken`
- `codewhisperer:StartTransformation`
- `codewhisperer:StopTransformation`
- `codewhisperer:ListTransformations`
- `codewhisperer:GetTransformation`
- IAM permissions for your development tools

## Resources

- [Amazon Q Documentation](https://docs.aws.amazon.com/amazonq/)
- [Amazon Q VS Code Extension](https://marketplace.visualstudio.com/items?itemName=amazonwebservices.amazon-q-vscode)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)

## Support

For issues with Amazon Q:
- Check AWS Console for Amazon Q service status
- Review CloudWatch logs for your AWS account
- Contact AWS Support for account-level issues

For issues with this project:
- Check the main README.md
- Review imperial_codex documentation
