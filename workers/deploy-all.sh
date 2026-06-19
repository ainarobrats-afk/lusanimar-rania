# ============================================================================
# RANIA V2.1 — Deploy All Workers
# The Safe Ghost Engine
#
# Usage:
#   bash workers/deploy-all.sh          # Deploy all 7 workers
#   bash workers/deploy-all.sh parser   # Deploy only worker-parser
#   bash workers/deploy-all.sh hunter   # Deploy only worker-hunter
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

WORKERS=(
  "worker-parser"
  "worker-hunter"
  "worker-validator"
  "worker-cashier"
  "worker-webhook"
  "worker-pilot"
  "worker-admin"
)

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

deploy_worker() {
  local worker=$1
  local worker_dir="$ROOT_DIR/workers/$worker"

  if [ ! -d "$worker_dir" ]; then
    echo -e "${RED}ERROR: Worker directory not found: $worker_dir${NC}"
    return 1
  fi

  echo -e "${YELLOW}Deploying $worker...${NC}"
  cd "$worker_dir"
  npx wrangler deploy

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}  OK: $worker deployed${NC}"
  else
    echo -e "${RED}  FAIL: $worker deployment failed${NC}"
    return 1
  fi
}

echo "========================================================"
echo "  RANIA V2.1 - Deploy All Workers"
echo "  The Safe Ghost Engine"
echo "========================================================"
echo ""

# Deploy specific worker if argument provided
if [ -n "$1" ]; then
  TARGET="worker-$1"
  deploy_worker "$TARGET"
  exit $?
fi

# Deploy all workers
FAILED=0
for worker in "${WORKERS[@]}"; do
  deploy_worker "$worker" || FAILED=1
done

echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All workers deployed successfully!${NC}"
else
  echo -e "${RED}Some workers failed to deploy. Check errors above.${NC}"
  exit 1
fi
