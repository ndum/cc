#!/usr/bin/env python3
"""The personal parameters of a student, computed from a personal code.

site/src/scripts/params-core.js computes the same values, scripts/params.test.mjs proves that
both agree. Change both files together, and only in ways that keep the values of existing codes.

    python3 scripts/params.py mmuster
    python3 scripts/params.py mmuster --fe 10.42.0.10 --node1 10.42.0.11 --node2 10.42.0.12
    python3 scripts/params.py mmuster --lang en
    python3 scripts/params.py mmuster --json
"""
import argparse
import hashlib
import json
import re
import sys

CODE_PATTERN = re.compile(r"^[a-z][a-z0-9]{1,15}$")


def normalize_code(raw):
    return (raw or "").strip().lower()


def params(code):
    digest = hashlib.sha256(f"cc2027:{code}".encode()).digest()
    second = 16 + digest[0] % 16
    third = digest[1]
    prefix = f"172.{second}.{third}"
    vni = 1000 + ((digest[2] << 8) | digest[3]) % 9000
    return {
        "code": code,
        "feHost": f"{code}-fe",
        "node1Host": f"{code}-node1",
        "node2Host": f"{code}-node2",
        "guestNet": f"{prefix}.0/24",
        "guestGateway": f"{prefix}.1",
        "guestFirst": f"{prefix}.10",
        "guestSize": 200,
        "vni": vni,
        "vxlanGroup": f"239.0.{vni >> 8}.{vni & 255}",
        "k3sServerIp": f"{prefix}.110",
        "k3sAgentIp": f"{prefix}.111",
    }


def env_lines(p, lab_ips, lang="de"):
    return [
        f"CC_CODE={p['code']}",
        f"CC_LANG={lang}",
        f"CC_FE_HOST={p['feHost']}",
        f"CC_NODE1_HOST={p['node1Host']}",
        f"CC_NODE2_HOST={p['node2Host']}",
        f"CC_FE_IP={lab_ips.get('fe') or ''}",
        f"CC_NODE1_IP={lab_ips.get('node1') or ''}",
        f"CC_NODE2_IP={lab_ips.get('node2') or ''}",
        f"CC_GUEST_NET={p['guestNet']}",
        f"CC_GUEST_GATEWAY={p['guestGateway']}",
        f"CC_GUEST_FIRST={p['guestFirst']}",
        f"CC_GUEST_SIZE={p['guestSize']}",
        f"CC_VNI={p['vni']}",
        f"CC_VXLAN_GROUP={p['vxlanGroup']}",
        f"CC_K3S_SERVER_IP={p['k3sServerIp']}",
        f"CC_K3S_AGENT_IP={p['k3sAgentIp']}",
    ]


def main():
    parser = argparse.ArgumentParser(description="Personal parameters of the CC lab")
    parser.add_argument("code")
    parser.add_argument("--fe")
    parser.add_argument("--node1")
    parser.add_argument("--node2")
    parser.add_argument("--lang", choices=["de", "en"], default="de")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    code = normalize_code(args.code)
    if not CODE_PATTERN.match(code):
        sys.exit("The code starts with a letter and has 2 to 16 letters or digits.")
    p = params(code)
    if args.json:
        print(json.dumps(p))
    else:
        print("\n".join(env_lines(p, {"fe": args.fe, "node1": args.node1, "node2": args.node2}, args.lang)))


if __name__ == "__main__":
    main()
