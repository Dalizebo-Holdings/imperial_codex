#!/bin/bash
# =============================================================================
# DALIZEBO.CO.ZA - STORAGE CLEANUP & MAINTENANCE SCRIPT
# Automated storage management to prevent disk full scenarios
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dalizebo Storage Maintenance${NC}"
echo -e "${BLUE}========================================${NC}"

# Check disk usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "${YELLOW}Current disk usage: ${DISK_USAGE}%${NC}"

if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  CRITICAL: Disk usage above 90%! Running aggressive cleanup...${NC}"
    AGGRESSIVE=true
elif [ "$DISK_USAGE" -gt 85 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Disk usage above 85%. Running standard cleanup...${NC}"
    AGGRESSIVE=false
else
    echo -e "${GREEN}✅ Disk usage within normal limits.${NC}"
    AGGRESSIVE=false
fi

# Function to get container/volume sizes
get_sizes() {
    echo -e "\n${BLUE}=== Docker System Overview ===${NC}"
    docker system df
    
    echo -e "\n${BLUE}=== Largest Containers ===${NC}"
    docker ps -s --format "table {{.Names}}\t{{.Size}}" | sort -k2 -rh | head -10
    
    echo -e "\n${BLUE}=== Data Directory Sizes ===${NC}"
    du -sh /workspace/dalizebo-stack/data/* 2>/dev/null | sort -rh | head -10
}

# Cleanup functions
cleanup_images() {
    echo -e "\n${BLUE}🧹 Cleaning up dangling and unused images...${NC}"
    
    # Remove dangling images
    docker image prune -f
    
    if [ "$AGGRESSIVE" = true ]; then
        echo -e "${YELLOW}Aggressive mode: Removing all unused images...${NC}"
        docker image prune -af --filter "until=24h"
    else
        # Remove images not used by any container (older than 7 days)
        docker image prune -f --filter "until=168h"
    fi
}

cleanup_containers() {
    echo -e "\n${BLUE}🧹 Removing stopped containers...${NC}"
    docker container prune -f
}

cleanup_volumes() {
    echo -e "\n${BLUE}🧹 Cleaning up unused volumes...${NC}"
    
    if [ "$AGGRESSIVE" = true ]; then
        echo -e "${YELLOW}Aggressive mode: Removing ALL unused volumes...${NC}"
        docker volume prune -f
    else
        # Just show orphaned volumes
        echo -e "${YELLOW}Orphaned volumes (not removed in standard mode):${NC}"
        docker volume ls -f dangling=true
    fi
}

cleanup_logs() {
    echo -e "\n${BLUE}🧹 Rotating container logs...${NC}"
    
    # Find and truncate large log files
    find /var/lib/docker/containers -name "*.log" -size +10M -exec truncate -s 0 {} \;
    
    # Clean old logs in our stack
    find /workspace/dalizebo-stack/logs -type f -mtime +7 -delete
    
    echo -e "${GREEN}✅ Log rotation complete${NC}"
}

cleanup_backups() {
    echo -e "\n${BLUE}🧹 Cleaning up old backups...${NC}"
    
    RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
    
    if [ -d "/workspace/dalizebo-stack/backups" ]; then
        find /workspace/dalizebo-stack/backups -type f -mtime +$RETENTION_DAYS -delete
        echo -e "${GREEN}✅ Removed backups older than $RETENTION_DAYS days${NC}"
    fi
}

optimize_databases() {
    echo -e "\n${BLUE}🗄️  Optimizing databases...${NC}"
    
    # VACUUM PostgreSQL if running
    if docker ps --format '{{.Names}}' | grep -q "dalizebo-postgres"; then
        echo -e "${YELLOW}Running VACUUM on PostgreSQL...${NC}"
        docker exec dalizebo-postgres psql -U postgres -d dalizebo_main -c "VACUUM ANALYZE;" 2>/dev/null || true
    fi
    
    # Clean Redis if running
    if docker ps --format '{{.Names}}' | grep -q "dalizebo-redis"; then
        echo -e "${YELLOW}Running BGSAVE on Redis...${NC}"
        docker exec dalizebo-redis redis-cli BGSAVE 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Database optimization complete${NC}"
}

# Main execution
get_sizes

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Cleanup Operations${NC}"
echo -e "${BLUE}========================================${NC}"

cleanup_containers
cleanup_images
cleanup_logs
cleanup_backups

if [ "$AGGRESSIVE" = true ]; then
    cleanup_volumes
fi

optimize_databases

# Final report
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Final Status${NC}"
echo -e "${BLUE}========================================${NC}"

NEW_DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
SPACE_FREED=$((DISK_USAGE - NEW_DISK_USAGE))

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo -e "Disk usage before: ${DISK_USAGE}%"
echo -e "Disk usage after:  ${NEW_DISK_USAGE}%"
echo -e "Space freed:       ${SPACE_FREED}%"

if [ "$NEW_DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ Disk usage now within healthy range (<80%)${NC}"
else
    echo -e "${YELLOW}⚠️  Disk usage still elevated. Consider manual intervention.${NC}"
fi

get_sizes

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Recommendations:${NC}"
echo -e "${BLUE}========================================${NC}"

if [ "$NEW_DISK_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}1. Review and delete old backups manually${NC}"
    echo -e "${YELLOW}2. Check for large files in data directories${NC}"
    echo -e "${YELLOW}3. Consider increasing VPS storage${NC}"
    echo -e "${YELLOW}4. Review Prometheus retention period${NC}"
fi

echo -e "${GREEN}Next automatic check: 1 hour${NC}"
