#!/usr/bin/env python3
"""The personal parameters of a student, computed from a personal code.

site/src/scripts/params-core.js computes the same values, scripts/params.test.mjs proves that
both agree. Change both files together, and only in ways that keep the values of existing codes.

    python3 scripts/params.py mmuster
    python3 scripts/params.py mmuster --fe 10.42.0.10 --node1 10.42.0.11 --node2 10.42.0.12
    python3 scripts/params.py mmuster --lang en
    python3 scripts/params.py mmuster --json
    python3 scripts/params.py mmuster --milestones
    python3 scripts/params.py mmuster --lab
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


# The lab network of every smartlearn environment, the same for all students because each one is isolated
LAB_NET = "192.168.210.0/24"
LAB_GATEWAY = "192.168.210.1"


def lab(code):
    """Addresses of the three lab VMs, three in a row between .20 and .199, from a digest of their own"""
    d = hashlib.sha256(f"cc2027-lab:{code}".encode()).digest()
    base = 20 + 3 * (((d[0] << 8) | d[1]) % 60)
    return {"fe": f"192.168.210.{base}", "node1": f"192.168.210.{base + 1}", "node2": f"192.168.210.{base + 2}"}


def milestones(code):
    """Values the milestones ask for, from a digest of their own so the values above never change"""
    d = hashlib.sha256(f"cc2027-ms:{code}".encode()).digest()
    return {
        "m1": {"gemeindeVms": (3, 4)[d[0] % 2], "gemeindeCpu": (1.5, 2)[d[1] % 2], "gemeindeMemory": (2560, 3072)[d[2] % 2]},
        "m2": {"gemeindeLimitsCpu": ("1", "1500m")[d[3] % 2], "gemeindeLimitsMemory": ("1Gi", "1536Mi")[d[4] % 2]},
        "m3": {"sloTarget": ("99.0", "99.9")[d[5] % 2], "hpaMax": (4, 5)[d[6] % 2]},
        "m4": {"backupHour": (1, 3, 4)[d[7] % 3], "backupKeep": (5, 10, 14)[d[8] % 3]},
    }


def questions(code, milestone, pool=6):
    """Two different questions of a pool for the screencast of a milestone"""
    d = hashlib.sha256(f"cc2027-q:{code}:{milestone}".encode()).digest()
    first = d[0] % pool
    return [first, (first + 1 + d[1] % (pool - 1)) % pool]


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
    parser.add_argument("--milestones", action="store_true", help="print the values of the milestones as JSON")
    parser.add_argument("--lab", action="store_true", help="print the addresses of the three lab VMs as JSON")
    args = parser.parse_args()
    code = normalize_code(args.code)
    if not CODE_PATTERN.match(code):
        sys.exit("The code starts with a letter and has 2 to 16 letters or digits.")
    if args.lab:
        print(json.dumps(lab(code)))
        return
    if args.milestones:
        print(json.dumps(milestones(code)))
        return
    p = params(code)
    if args.json:
        print(json.dumps(p))
    else:
        # Addresses given on the command line win, for a lab outside smartlearn
        given = {"fe": args.fe, "node1": args.node1, "node2": args.node2}
        ips = {**lab(code), **{key: value for key, value in given.items() if value}}
        print("\n".join(env_lines(p, ips, args.lang)))


if __name__ == "__main__":
    main()
