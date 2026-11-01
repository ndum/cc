#!/bin/bash
# Writes the OneFlow service of the fiduciary office, the service of chapter 3.5.
#
#   ./make-service.sh > ~/cc-lab/treuhand-service.json
#   oneflow-template create ~/cc-lab/treuhand-service.json
#
# The role uses the template ubuntu, its number differs from lab to lab.
set -euo pipefail

TEMPLATE_ID=$(onetemplate show ubuntu --json | python3 -c 'import json, sys; print(json.load(sys.stdin)["VMTEMPLATE"]["ID"])')

cat <<JSON
{
  "name": "treuhand-buchhaltung",
  "description": "Accounting service of the fiduciary office that grows under load",
  "deployment": "straight",
  "roles": [
    {
      "name": "app",
      "type": "vm",
      "template_id": $TEMPLATE_ID,
      "cardinality": 1,
      "min_vms": 1,
      "max_vms": 3,
      "cooldown": 60,
      "elasticity_policies": [
        { "type": "CHANGE", "adjust": 1, "expression": "CPU > 60", "period": 30, "period_number": 2 },
        { "type": "CHANGE", "adjust": -1, "expression": "CPU < 10", "period": 30, "period_number": 4 }
      ]
    }
  ]
}
JSON
