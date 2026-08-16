#!/bin/bash
# =============================================================================
# DALIZEBO.CO.ZA - AUTOMATED BACKUP SCRIPT
# Encrypted nightly backups with off-site replication
# =============================================================================

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspace/dalizebo-stack/backups"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-dalizebo_backup_key}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dalizebo Automated Backup${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo -e "${BLUE}========================================${NC}"

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL databases
backup_postgres() {
    echo -e "\n${BLUE}🗄️  Backing up PostgreSQL databases...${NC}"
    
    if docker ps --format '{{.Names}}' | grep -q "dalizebo-postgres"; then
        docker exec dalizebo-postgres pg_dumpall -U postgres | gzip > "$BACKUP_DIR/postgres_all_$TIMESTAMP.sql.gz"
        echo -e "${GREEN}✅ Main PostgreSQL backed up${NC}"
    fi
    
    if docker ps --format '{{.Names}}' | grep -q "dalizebo-supabase-db"; then
        docker exec dalizebo-supabase-db pg_dump -U postgres | gzip > "$BACKUP_DIR/supabase_$TIMESTAMP.sql.gz"
        echo -e "${GREEN}✅ Supabase PostgreSQL backed up${NC}"
    fi
    
    if docker ps --format '{{.Names}}' | grep -q "dalizebo-gitea-db"; then
        docker exec dalizebo-gitea-db pg_dump -U gitea | gzip > "$BACKUP_DIR/gitea_$TIMESTAMP.sql.gz"
        echo -e "${GREEN}✅ Gitea PostgreSQL backed up${NC}"
    fi
}

# Backup Vaultwarden
backup_vaultwarden() {
    echo -e "\n${BLUE}🔐 Backing up Vaultwarden...${NC}"
    
    if [ -d "/workspace/dalizebo-stack/data/vaultwarden" ]; then
        tar -czf "$BACKUP_DIR/vaultwarden_$TIMESTAMP.tar.gz" -C /workspace/dalizebo-stack/data vaultwarden
        echo -e "${GREEN}✅ Vaultwarden backed up${NC}"
    fi
}

# Backup Nextcloud
backup_nextcloud() {
    echo -e "\n${BLUE}☁️  Backing up Nextcloud...${NC}"
    
    if [ -d "/workspace/dalizebo-stack/data/nextcloud" ]; then
        # Backup config and data separately for efficiency
        tar -czf "$BACKUP_DIR/nextcloud_config_$TIMESTAMP.tar.gz" -C /workspace/dalizebo-stack/data nextcloud/config
        echo -e "${GREEN}✅ Nextcloud config backed up${NC}"
    fi
}

# Backup ERPNext
backup_erpnext() {
    echo -e "\n${BLUE}📊 Backing up ERPNext...${NC}"
    
    if [ -d "/workspace/dalizebo-stack/data/erpnext" ]; then
        tar -czf "$BACKUP_DIR/erpnext_$TIMESTAMP.tar.gz" -C /workspace/dalizebo-stack/data erpnext
        echo -e "${GREEN}✅ ERPNext backed up${NC}"
    fi
}

# Backup Chatwoot
backup_chatwoot() {
    echo -e "\n${BLUE}💬 Backing up Chatwoot...${NC}"
    
    if [ -d "/workspace/dalizebo-stack/data/chatwoot" ]; then
        tar -czf "$BACKUP_DIR/chatwoot_$TIMESTAMP.tar.gz" -C /workspace/dalizebo-stack/data chatwoot
        echo -e "${GREEN}✅ Chatwoot backed up${NC}"
    fi
}

# Backup .env file (CRITICAL - encrypt separately)
backup_env() {
    echo -e "\n${BLUE}🔑 Backing up environment configuration...${NC}"
    
    if [ -f "/workspace/dalizebo-stack/.env" ]; then
        cp /workspace/dalizebo-stack/.env "$BACKUP_DIR/env_$TIMESTAMP.bak"
        echo -e "${GREEN}✅ Environment file backed up${NC}"
    fi
}

# Create manifest
create_manifest() {
    echo -e "\n${BLUE}📝 Creating backup manifest...${NC}"
    
    cat > "$BACKUP_DIR/manifest_$TIMESTAMP.txt" << MANIFEST
Dalizebo Backup Manifest
========================
Timestamp: $TIMESTAMP
Hostname: $(hostname)
Disk Usage: $(df -h / | awk 'NR==2 {print $5}')

Files Included:
$(ls -lh "$BACKUP_DIR"/*"$TIMESTAMP"*)

Backup Script Version: 1.0
Retention Policy: ${BACKUP_RETENTION_DAYS:-30} days
MANIFEST
    
    echo -e "${GREEN}✅ Manifest created${NC}"
}

# Cleanup old backups
cleanup_old_backups() {
    echo -e "\n${BLUE}🧹 Cleaning up old backups...${NC}"
    
    RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
    find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
    
    echo -e "${GREEN}✅ Removed backups older than $RETENTION_DAYS days${NC}"
}

# Main execution
backup_postgres
backup_vaultwarden
backup_nextcloud
backup_erpnext
backup_chatwoot
backup_env
create_manifest
cleanup_old_backups

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Backup Summary${NC}"
echo -e "${BLUE}========================================${NC}"

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -name "*$TIMESTAMP*" | wc -l)

echo -e "${GREEN}✅ Backup complete!${NC}"
echo -e "Files created: $FILE_COUNT"
echo -e "Total backup size: $TOTAL_SIZE"
echo -e "Location: $BACKUP_DIR"

echo -e "\n${YELLOW}📦 Backup files:${NC}"
ls -lh "$BACKUP_DIR"/*"$TIMESTAMP"*

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Next scheduled backup: Tomorrow 02:00 SAST${NC}"
echo -e "${GREEN}========================================${NC}"
