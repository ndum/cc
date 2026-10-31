/**
 * The personal parameters of a student, computed from a personal code.
 *
 * scripts/params.py computes the same values, scripts/params.test.mjs proves that both agree.
 * Change both files together, and only in ways that keep the values of existing codes, because
 * students and their hand-ins rely on them for the whole course.
 */

export const CODE_PATTERN = /^[a-z][a-z0-9]{1,15}$/;

/** Lower case and trimmed, so «MMuster » and «mmuster» give the same values */
export function normalizeCode(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

/**
 * @param {string} code a normalized personal code
 * @param {Uint8Array} digest the SHA-256 digest of `cc2027:${code}`
 */
export function paramsFromDigest(code, digest) {
  // 172.16.0.0/12 holds the guest networks, 16 values for the second octet and 256 for the third
  const second = 16 + (digest[0] % 16);
  const third = digest[1];
  const prefix = `172.${second}.${third}`;
  // VXLAN ids 1000 to 9999, so two students on one network never share a segment
  const vni = 1000 + (((digest[2] << 8) | digest[3]) % 9000);
  return {
    code,
    feHost: `${code}-fe`,
    node1Host: `${code}-node1`,
    node2Host: `${code}-node2`,
    guestNet: `${prefix}.0/24`,
    guestGateway: `${prefix}.1`,
    guestFirst: `${prefix}.10`,
    guestSize: 200,
    vni,
    // OpenNebula derives the multicast group of a VXLAN network from 239.0.0.0 plus the id
    vxlanGroup: `239.0.${vni >> 8}.${vni & 255}`,
    k3sServerIp: `${prefix}.110`,
    k3sAgentIp: `${prefix}.111`,
  };
}

/** The lines of /etc/cc-lab.env, the file the prepare script and the checks read */
export function envLines(params, labIps = {}, lang = 'de') {
  const lines = [
    `CC_CODE=${params.code}`,
    // Language of the reports of the check scripts
    `CC_LANG=${lang}`,
    `CC_FE_HOST=${params.feHost}`,
    `CC_NODE1_HOST=${params.node1Host}`,
    `CC_NODE2_HOST=${params.node2Host}`,
    `CC_FE_IP=${labIps.fe ?? ''}`,
    `CC_NODE1_IP=${labIps.node1 ?? ''}`,
    `CC_NODE2_IP=${labIps.node2 ?? ''}`,
    `CC_GUEST_NET=${params.guestNet}`,
    `CC_GUEST_GATEWAY=${params.guestGateway}`,
    `CC_GUEST_FIRST=${params.guestFirst}`,
    `CC_GUEST_SIZE=${params.guestSize}`,
    `CC_VNI=${params.vni}`,
    `CC_VXLAN_GROUP=${params.vxlanGroup}`,
    `CC_K3S_SERVER_IP=${params.k3sServerIp}`,
    `CC_K3S_AGENT_IP=${params.k3sAgentIp}`,
  ];
  return lines;
}
