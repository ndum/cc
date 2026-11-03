---
title: Linux networking in the lab
description: Interfaces and routes with ip, netplan and systemd-networkd on Ubuntu 26.04, the bridges and VXLAN devices, NAT and the firewall with nftables, DNS, the MTU and the k3s pod network, with the commands to inspect each server.
sidebar:
  order: 3
---

:::goals
After this chapter you can:

- Read the interfaces, addresses and routes of a server with `ip`
- Explain how netplan, systemd-networkd and systemd-resolved set up the network of a server
- Match the bridges and VXLAN devices on the front-end and the nodes to their purpose
- Read the tables `cc_gateway` and `cc_firewall` and explain how they work together
- Justify where the MTU of 1450 applies in the lab and where it comes from
- Describe the path of a packet from a pod to the internet
:::

Your lab stacks several networks on top of each other. This supplement shows how Linux implements them and how you check that on each machine. Like the [lab reference](../../lab-reference/), the examples use the code `mmuster` and the interface `eth0`. Your interface may have another name, such as `ens160`, which you looked up in [chapter 0.3](../../start/parameters/). Every command on this page only reads.

## The networks in the lab

| Machine | Lab network 192.168.210.0/24 | cc-net 172.31.160.0/24 | Pod network 10.52.0.0/16 |
|---|---|---|---|
| Client | .10 | no address | no address |
| Front-end | .137 on `eth0` | .1 on `cc-br` | no address |
| Nodes 1 and 2 | .138 and .139 on `eth0` | no address, they only carry the traffic | no address |
| Member VMs | no address | from .10 | no address |
| `k3s-server` and `k3s-agent` | no address | .110 and .111 | one /24 each on `cni0` |

Only the front-end has addresses on both the lab network and cc-net, which makes it the gateway of cc-net. The nodes forward cc-net traffic at layer 2 without holding an address in it themselves. You can therefore reach a VM in cc-net from the front-end but not from a node. Only the two k3s VMs know the pod addresses.

## Interfaces and addresses

The `ip` tool from iproute2, version 6.19 on Ubuntu 26.04, shows and changes interfaces, addresses and routes. `-br` shortens the output to one line per interface, and `-d` adds details such as the type of a device. The [ip-link manual page](https://manpages.ubuntu.com/manpages/resolute/man8/ip-link.8.html) describes all device types.

```bash
ip -br link
ip -br addr
ip -d link show cc-vxlan
```

On the front-end, `ip -br addr` lists the lab address on `eth0`, the gateway on `cc-br` and `cc-vxlan` without an IPv4 address. `ip -d link show cc-vxlan` shows the MTU of 1450, the bridge of the device as `master cc-br`, and the identifier, group and port of the VXLAN.

## netplan and systemd-networkd

You set the lab address with netplan in chapter 0.3. netplan reads the YAML files in `/etc/netplan/` in lexicographic order, and later files add to or override earlier ones, as the [netplan generate documentation](https://netplan.readthedocs.io/en/stable/netplan-generate/) explains. From them it writes files for systemd-networkd to `/run/systemd/network/`, for example `10-netplan-eth0.network`. systemd-networkd then sets up address, route and DNS servers from those files. Since `/run` is empty after a reboot, netplan generates the files again at every boot, so you only ever change the YAML files.

netplan knows nothing about the devices that `cc-gateway` and OpenNebula create. `networkctl list` shows them as `unmanaged`, and systemd-networkd leaves them alone. The service `cc-gateway` starts only after `network-online.target`, because it reads the lab interface from the default route. The firewall from chapter 6.1 loads before `network-pre.target` instead, so it is in place before systemd-networkd sets up the first interface.

```bash
netplan status
networkctl list
sudo cat /run/systemd/network/10-netplan-eth0.network
```

On node 1, `netplan status` shows the systemd-resolved stub and, for `eth0`, the address, DNS server and routes.

```text
     Online state: online
    DNS Addresses: 127.0.0.53 (stub)

●  2: eth0 ethernet UP (networkd: eth0)
        Addresses: 192.168.210.138/24
                   fe80::215:5dff:fe01:6e03/64 (link)
    DNS Addresses: 192.168.210.1
           Routes: default via 192.168.210.1 (static)
                   192.168.210.0/24 from 192.168.210.138 (link)
```

## Bridges and VXLAN

A **bridge** connects interfaces at layer 2 like a switch. It learns which MAC address sits behind which port and sends frames for a known address only to that port. A **VXLAN device** is a port that wraps frames in UDP packets and sends them out through another interface.

On the front-end `cc-gateway` creates both, `cc-vxlan` inside the bridge `cc-br`, which holds the gateway address. On the nodes OpenNebula creates the bridge `ccbr5862` and the VXLAN device `eth0.5862` as soon as a VM from cc-net runs there. The VM NICs join the same bridge with names such as `one-12-0`, as the supplement [OpenNebula in depth](../opennebula/) shows. The bridge on a node has no address.

![Bridges and VXLAN in the lab. On the left the front-end, on the right node 1 with two VMs. On both, eth0 has an MTU of 1500 and an address on the lab network. On the front-end, cc-gateway creates the bridge cc-br with the gateway 172.31.160.1/24 and in it the VXLAN device cc-vxlan, both with an MTU of 1450. The kernel forwards packets from cc-net to eth0 with ip_forward=1, and the table cc_gateway replaces their source with 192.168.210.137. On the node, OpenNebula creates the bridge ccbr5862 without an address and in it the VXLAN device eth0.5862. The kernel gives that device the MTU of eth0 minus 50 bytes, which is 1450. The VM NICs such as one-12-0 join the same bridge, and libvirt gives them the MTU of the bridge. The VMs themselves get 1450 through the context. The two VXLAN devices join the bridges into the network cc-net. They wrap the frames in UDP packets to port 8472 and find each other through the multicast group 239.0.22.230 on the lab network. Notice that the bridge on the node has no address. Of the servers, only the front-end has an address in cc-net.](../../../../assets/figures/en/ex-network.svg)

There is no bridge `br0` holding the node's address in the lab, the kind the `bridge` network driver requires. With VXLAN, `eth0` keeps its address. The libvirt network `default` with its bridge `virbr0` is missing too, because OneDeploy turns it off during the installation.

```bash
sudo cc-gateway status
```

```text
cc-br            UP             172.31.160.1/24 fe80::fcbf:e3ff:fe9a:6827/64
vxlan id 5862 group 239.0.22.230
ip_forward=1
        ip saddr 172.31.160.0/24 oifname "eth0" masquerade
```

The output shows the bridge with the gateway, the VXLAN with identifier and group, forwarding and the NAT rule.

A VXLAN device decides where to send a frame from its **forwarding table**. For every MAC address it has already received a packet from, the table names the server behind it. All other destinations go to the multicast group 239.0.22.230, as the [kernel documentation](https://docs.kernel.org/networking/vxlan.html) describes, and the table holds an entry with the address `00:00:00:00:00:00` for this case. Packets to the group reach every server that joined it. `ip maddr` shows this membership on `eth0`.

```bash
bridge fdb show dev cc-vxlan
ip maddr show dev eth0
ssh mmuster-node1 'ip link show master ccbr5862; bridge fdb show dev eth0.5862'
```

On the front-end the table lists the MAC addresses of the VMs with the address of their node. On the node, `ip link show master` shows the VXLAN device and the VM NICs in the bridge.

## Routes and the default route

For every packet the kernel picks the route with the longest matching prefix. On the front-end, the lab network and cc-net are directly attached to `eth0` and `cc-br`. Everything else takes the default route to 192.168.210.1, the smartlearn gateway. The nodes only know the lab network and the default route. The VMs in cc-net get 172.31.160.1 as their default route through the context.

The client does not know cc-net. Its packets for 172.31.160.0/24 would go to the smartlearn gateway, which does not know cc-net either. That is why you reach services in cc-net from the client only through an SSH tunnel to the front-end, as the lab reference shows.

Three course scripts read the lab interface from the default route. `prepare.sh` prints it on the nodes, `make-network.sh` puts it into cc-net as `PHYDEV`, and `cc-gateway` sends the VXLAN through it. A Linux server only forwards packets for other machines when `net.ipv4.ip_forward` is on. In the lab only the front-end needs that, since the bridges on the nodes work at layer 2.

```bash
ip route
ip route get 172.31.160.110
ip route get 9.9.9.9
```

`ip route get` shows the interface, the next gateway and the source address for a destination. On the front-end, 172.31.160.110 goes out through `cc-br` with the source 172.31.160.1, and 9.9.9.9 through `eth0` via 192.168.210.1.

## NAT and the firewall with nftables

nftables is the packet filter of the Linux kernel. Rules live in chains, and chains live in tables. A base chain attaches to a **hook**, a fixed point on a packet's way through the kernel. Packets for the front-end itself pass `input`, while packets to be forwarded pass `prerouting`, `forward` and `postrouting`, as the [nft manual page](https://manpages.ubuntu.com/manpages/resolute/man8/nft.8.html) describes. The front-end holds two tables of the course.

| Table | Family | Chain | Contents | Chapter |
|---|---|---|---|---|
| `cc_gateway` | `ip` | `postrouting`, type `nat` | Masquerade for cc-net going out through `eth0` | [0.4](../../start/prepare/) |
| `cc_firewall` | `inet` | `input`, type `filter`, policy `drop` | Replies, `lo`, ICMP, DHCP, the nodes and cc-net, ports 22 and 2616 | [6.1](../../operations/security/) |

The firewall only checks packets addressed to the front-end itself. VM traffic to the internet passes hooks where the firewall has no chain, and the replies do not reach `input` either. Connection tracking recognizes them as part of a known connection, puts the VM's address back in as the destination, and the kernel forwards them. VXLAN and the monitoring traffic of the nodes get through because the firewall accepts everything from the node addresses.

With two tables, each script replaces only its own. `cc-gateway down` deletes `cc_gateway` and leaves the firewall in place. The firewall file starts with `table inet cc_firewall` and `delete table inet cc_firewall` and then builds the table again. `nft -f` applies the whole file in a single step, as the [nftables wiki](https://wiki.nftables.org/wiki-nftables/index.php/Atomic_rule_replacement) explains, so there is no moment without a firewall. When several base chains attach to the same hook, a packet passes all of them. An `accept` only ends its own chain, while a `drop` is final.

On the nodes OpenNebula puts the security group rules into a chain `opennebula` with iptables. On Ubuntu 26.04 iptables writes its rules into nftables, so `sudo nft list ruleset` shows them as well. Inside the k3s VMs, kube-proxy and flannel also write their rules with iptables.

```bash
sudo nft list tables
sudo nft list table ip cc_gateway
sudo nft list table inet cc_firewall
```

`nft list tables` lists every table with its family, and the other two commands show the contents of the course tables. `cc_firewall` only exists after chapter 6.1.

## DNS

On the three servers systemd-resolved answers name lookups. `/etc/resolv.conf` is a link to `/run/systemd/resolve/stub-resolv.conf` and lists only the local stub 127.0.0.53. resolved then asks the DNS servers that netplan passes on through systemd-networkd, 192.168.210.1 on smartlearn. The [systemd-resolved manual page](https://manpages.ubuntu.com/manpages/resolute/man8/systemd-resolved.service.8.html) recommends this setup. The names of the three servers need no DNS. `prepare.sh` wrote them to `/etc/hosts`, and `/etc/nsswitch.conf` makes the servers read that file before asking DNS.

The VMs in cc-net get the DNS servers 9.9.9.9 and 1.1.1.1 through the context, which `make-network.sh` writes into the network. Their queries travel through the gateway to the internet like any other traffic.

In the cluster, CoreDNS at 10.53.0.10 answers for service names such as `webshop.velo.svc.cluster.local` and forwards other names to the DNS servers of the VM. If `/etc/resolv.conf` on the VM lists a local address such as the stub 127.0.0.53, k3s hands the pods `/run/systemd/resolve/resolv.conf` with the real servers instead. A pod cannot reach the stub of the VM, and the [Kubernetes documentation](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/) describes the loop that would result.

```bash
ls -l /etc/resolv.conf
resolvectl status
getent hosts mmuster-node1
```

`resolvectl status` shows the DNS servers per interface, and `getent hosts` resolves a name the same way any program does.

## MTU

[Chapter 2.3](../../iaas/networks/) works out why 1450 bytes remain in cc-net. On the servers you can see where that value comes from. `eth0` has 1500 bytes everywhere. On the front-end, `cc-gateway` sets 1450 explicitly for `cc-vxlan` and `cc-br`. On the nodes, OpenNebula asks for 1500 bytes for `eth0.5862` because cc-net has no `MTU` attribute. The kernel, however, caps a VXLAN device at the MTU of the interface below minus 50 bytes and sets 1450. The bridge takes the smallest value of its ports, and libvirt gives the VM NICs the MTU of the bridge. The VMs themselves get 1450 through `GUEST_MTU` and the context.

The MTU also sets the size of TCP segments. When a connection opens, each side announces how many bytes of payload it accepts per segment, which for IPv4 is the MTU minus 40 bytes for the IP and TCP headers. A VM with 1450 announces 1410. With 1500 it would announce 1460 and receive packets that do not fit through the VXLAN.

Inside the k3s VMs, `eth0` has an MTU of 1450. With host-gw, flannel passes it on unchanged to `cni0` and the pods, since host-gw wraps nothing. The default flannel backend `vxlan` would take off another 50 bytes and leave the pods 1400. The [k3s documentation](https://docs.k3s.io/networking/basic-network-options) lists the backends.

```bash
ip link show eth0
ip link show cc-br
ssh mmuster-node1 ip link show eth0.5862
ssh root@172.31.160.110 cat /run/flannel/subnet.env
```

The first line of each device shows its MTU. `subnet.env` shows the pod network of the node and `FLANNEL_MTU=1450`.

## The k3s pod network

On each k3s VM, flannel creates the bridge `cni0`. It holds the first address of the node's pod network, 10.52.0.1 on the server in the lab. Every pod connects to it through a veth pair, with one end inside the pod and the other in `cni0`. With host-gw, each node gets a route for every other node that reaches that node's pod network through its address in cc-net, as [chapter 4.3](../../platform/kubernetes/) explains.

```bash
ssh root@172.31.160.110 'ip route | grep 10.52'
```

```text
10.52.0.0/24 dev cni0 proto kernel scope link src 10.52.0.1
10.52.1.0/24 via 172.31.160.111 dev eth0
```

The first route leads to the pods on the server itself, the second through the agent to its pods.

A packet from a pod on the agent to the internet gets a new source address twice on its way. It leaves the pod through `cni0` and follows the default route of the VM. Since the destination lies outside the pod network, the flannel masquerade replaces the pod address with 172.31.160.111. Through `eth0` of the VM the packet enters the bridge `ccbr5862` on the node, crosses the VXLAN to the front-end and leaves there from `cc-br` through `eth0`. On the way out, `cc_gateway` replaces the address once more, now with 192.168.210.137. The reply takes the same way back, and both stations find their entry in connection tracking. Packets between pods on different nodes keep their addresses.

## Commands per server

The table lists what to look at on which machine. You log in to the VMs in cc-net as `root` from the front-end.

| Machine | Commands | What you see |
|---|---|---|
| Client | `ip -br addr`, `ip route` | the address .10 and no route to cc-net |
| Front-end | `sudo cc-gateway status`, `bridge fdb show dev cc-vxlan`, `sudo nft list ruleset`, `resolvectl status` | gateway, VXLAN, NAT, firewall and DNS |
| Node | `ip -br link`, `ip link show master ccbr5862`, `bridge fdb show dev eth0.5862`, `sudo nft list ruleset` | the OpenNebula bridge and VXLAN, the chain `opennebula` |
| VM in cc-net | `ip -br addr`, `ip link show eth0`, `ip route` | address and MTU from the context, the default route via .1 |
| `k3s-server`, `k3s-agent` | `ip route`, `ip -br link`, `cat /run/flannel/subnet.env` | host-gw routes, `cni0` and the veth devices of the pods |

::::exercise[Lab]
Trace a packet from a pod on `k3s-agent` to `ubuntu.com`. If you have not reached part 4 yet, use a VM in cc-net such as `web-1` from chapter 2.4. For each station, write down the machine, the interface, its MTU and the source address the packet carries onward. Back every statement with a command from this page.

:::solution
1. Inside the pod the packet has an address from the agent's pod network, such as 10.52.1.0/24. It leaves the pod through its veth device toward `cni0` with an MTU of 1450 (`subnet.env`, `ip -br link`).
2. On `k3s-agent` the default route via 172.31.160.1 applies, and the flannel masquerade sets the source to 172.31.160.111 (`ip route`).
3. On the agent's node the frame runs from the NIC `one-<id>-0` through `ccbr5862` into `eth0.5862`, all with an MTU of 1450 (`ip link show master ccbr5862`).
4. On the lab network it travels inside a UDP packet to port 8472 from the node to the front-end, with the node's address as the source (`bridge fdb show dev eth0.5862`).
5. On the front-end `cc-vxlan` unwraps it, and the packet reaches the kernel through `cc-br`, which forwards it to `eth0` (`ip route get 9.9.9.9`).
6. The table `cc_gateway` replaces the source with 192.168.210.137, and the packet goes on to 192.168.210.1 (`sudo nft list table ip cc_gateway`).

For a VM such as `web-1`, steps 1 and 2 drop out, and its cc-net address stays unchanged until the front-end.
:::
::::
