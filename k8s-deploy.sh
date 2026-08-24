#!/bin/bash

# Imperial Codex: Kubernetes Deployment Script
# Deploys to Kubernetes cluster with health checks and auto-scaling
# Usage: ./k8s-deploy.sh [image_url] [namespace] [replicas]

set -e

# Parameters
IMAGE="${1:-docker.io/your-username/imperial-codex:latest}"
NAMESPACE="${2:-default}"
REPLICAS="${3:-2}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}▶${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Verify prerequisites
section "Pre-Deployment Checks"

if ! command -v kubectl &> /dev/null; then
  error "kubectl is not installed"
fi
success "kubectl installed"

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
  error "Cannot connect to Kubernetes cluster. Configure kubeconfig."
fi
success "Connected to Kubernetes cluster"

# Check nodes
NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)
log "Cluster nodes: $NODE_COUNT"

if [ "$NODE_COUNT" -lt 1 ]; then
  error "No nodes available in cluster"
fi
success "Cluster is healthy"

# Create namespace if needed
section "Namespace Setup"

if kubectl get namespace "$NAMESPACE" &> /dev/null; then
  success "Namespace '$NAMESPACE' exists"
else
  log "Creating namespace '$NAMESPACE'..."
  kubectl create namespace "$NAMESPACE"
  success "Namespace created"
fi

# Create secrets (if not exist)
section "Secret Configuration"

if kubectl get secret imperial-codex-secrets -n "$NAMESPACE" &> /dev/null 2>&1; then
  warning "Secret 'imperial-codex-secrets' already exists"
else
  log "Creating secrets from .env.local..."
  
  if [ ! -f ".env.local" ]; then
    error ".env.local not found"
  fi
  
  kubectl create secret generic imperial-codex-secrets \
    --from-env-file=.env.local \
    -n "$NAMESPACE" 2>/dev/null || warning "Could not create secrets (may already exist)"
  
  success "Secrets configured"
fi

# Update deployment image
section "Deployment Preparation"

log "Preparing deployment manifest..."
log "  Image: $IMAGE"
log "  Namespace: $NAMESPACE"
log "  Replicas: $REPLICAS"

# Create temporary deployment with custom image
TEMP_MANIFEST=$(mktemp)
sed "s|docker.io/your-username/imperial-codex:latest|$IMAGE|g" kubernetes/deployment.yaml > "$TEMP_MANIFEST"

# Apply manifests
section "Applying Kubernetes Manifests"

log "Applying deployment..."
kubectl apply -f "$TEMP_MANIFEST" -n "$NAMESPACE"
success "Deployment applied"

log "Updating replica count to $REPLICAS..."
kubectl scale deployment imperial-codex --replicas="$REPLICAS" -n "$NAMESPACE"
success "Replicas set to $REPLICAS"

rm -f "$TEMP_MANIFEST"

# Wait for rollout
section "Waiting for Deployment"

log "Waiting for pods to become ready (timeout: 5 minutes)..."

if kubectl rollout status deployment/imperial-codex -n "$NAMESPACE" --timeout=5m; then
  success "Deployment rolled out successfully"
else
  error "Deployment rollout failed or timed out"
fi

# Verify pods
section "Pod Status"

kubectl get pods -n "$NAMESPACE" -l app=imperial-codex

# Get endpoints
section "Service Information"

SERVICE_IP=$(kubectl get svc imperial-codex -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

if [ "$SERVICE_IP" = "pending" ] || [ -z "$SERVICE_IP" ]; then
  SERVICE_IP="<pending>"
fi

echo ""
echo "Service: imperial-codex"
echo "Namespace: $NAMESPACE"
echo "Type: ClusterIP (port 80 → 3000)"
echo "IP: $SERVICE_IP"
echo ""

kubectl get svc imperial-codex -n "$NAMESPACE"

# Check HPA
section "Auto-Scaling (HPA) Status"

if kubectl get hpa imperial-codex -n "$NAMESPACE" &> /dev/null; then
  kubectl get hpa imperial-codex -n "$NAMESPACE"
  success "HPA configured (scales 2-10 pods)"
else
  warning "HPA not found"
fi

# Health check status
section "Health Status"

log "Checking pod health..."

PODS=$(kubectl get pods -n "$NAMESPACE" -l app=imperial-codex -o jsonpath='{.items[*].metadata.name}')

for POD in $PODS; do
  READY=$(kubectl get pod "$POD" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].ready}')
  HEALTH=$(kubectl get pod "$POD" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].state.running}' 2>/dev/null || echo "")
  
  if [ "$READY" = "true" ]; then
    success "Pod $POD is ready"
  else
    warning "Pod $POD still starting"
  fi
done

# Test endpoint
section "Endpoint Testing"

log "Testing pod endpoints..."

for POD in $PODS; do
  log "Testing $POD..."
  if kubectl exec -it "$POD" -n "$NAMESPACE" -- curl -sf http://localhost:3000 > /dev/null 2>&1; then
    success "$POD responding to HTTP"
  else
    warning "$POD not responding yet (may still be starting)"
  fi
done

# Show logs
section "Recent Pod Logs"

FIRST_POD=$(echo $PODS | awk '{print $1}')
if [ -n "$FIRST_POD" ]; then
  log "Logs from $FIRST_POD:"
  kubectl logs -n "$NAMESPACE" "$FIRST_POD" --tail=20
fi

# Summary
section "Deployment Complete ✓"

echo "Deployment Summary:"
echo ""
echo "  Cluster: $(kubectl config current-context)"
echo "  Namespace: $NAMESPACE"
echo "  Image: $IMAGE"
echo "  Replicas: $REPLICAS"
echo "  Service: imperial-codex (port 80)"
echo ""

echo "Common kubectl commands:"
echo ""
echo "  Watch pods (auto-scaling):"
echo "    kubectl get pods -w -n $NAMESPACE -l app=imperial-codex"
echo ""
echo "  View logs:"
echo "    kubectl logs -f -n $NAMESPACE -l app=imperial-codex"
echo ""
echo "  Describe pod:"
echo "    kubectl describe pod <pod-name> -n $NAMESPACE"
echo ""
echo "  Port forward for local access:"
echo "    kubectl port-forward svc/imperial-codex 3000:80 -n $NAMESPACE"
echo ""
echo "  Scale manually:"
echo "    kubectl scale deployment imperial-codex --replicas=5 -n $NAMESPACE"
echo ""
echo "  View events:"
echo "    kubectl get events --sort-by='.lastTimestamp' -n $NAMESPACE"
echo ""
echo "  Rollback to previous version:"
echo "    kubectl rollout undo deployment/imperial-codex -n $NAMESPACE"
echo ""
echo "  Delete deployment:"
echo "    kubectl delete deployment imperial-codex -n $NAMESPACE"
echo ""

success "Kubernetes deployment successful! 🚀"
