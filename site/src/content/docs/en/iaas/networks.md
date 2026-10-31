---
title: Virtual networks
description: The network drivers of OpenNebula, the internal network of your cloud as VXLAN from your personal parameters, address ranges and leases, and how the gateway on the front-end fits in.
sidebar:
  order: 3
---

:::assignment
"The members ask whether their servers reach the internet and whether anyone can see them from outside," Simone Wyss writes. "Can you set up a network for our VMs without us having to change anything on the school's network?"
:::

:::goals
After this chapter you can

- tell the network drivers of OpenNebula apart and justify VXLAN,
- create the internal network of your cloud from your parameters,
- explain what an address range and a lease are,
- describe how network, gateway and NAT work together.
:::

## Network drivers

A virtual network in OpenNebula describes how VMs connect to a network. The network driver decides how that happens on the nodes.

| Driver | How it works | Suitable when |
|---|---|---|
| `bridge` | The VMs connect directly to the node's network through a Linux bridge. | the node's network accepts foreign MAC addresses |
| `802.1Q` | Each virtual network gets its own VLAN on the physical network. | the switch provides VLANs for the nodes |
| `vxlan` | The VMs' network travels in UDP packets across the existing network between the nodes. | the existing network should know nothing about the VMs |
| `ovswitch` | Open vSwitch instead of a Linux bridge, with features such as flow rules | large installations with special requirements |

Your lab uses `vxlan`. Only the addresses of your three VMs appear on the lab network, and the VMs of the cloud are invisible there. That is why the lab also works on smartlearn, where the hypervisor does not let foreign MAC addresses through.

## VXLAN

VXLAN (Virtual Extensible LAN) wraps every Ethernet frame of a VM in a UDP packet and sends it across the lab network to the node that runs the target VM. There the kernel unwraps the frame again. An identifier between 1 and about 16 million keeps networks apart, in your lab it is `CC_VNI` from your parameters. Frames to everyone, such as ARP requests, go to a multicast group that OpenNebula derives from 239.0.0.0 and the identifier. The gateway on the front-end joins the same group and so belongs to the same network.

The VXLAN header and the outer packet take 50 bytes. If the lab network carries 1500 bytes per packet, the VMs may only send 1450. If they send more, large packets get lost, and HTTPS downloads break off while small requests still work. The network therefore gives the VMs an MTU of 1450.

## Creating the internal network

The script `lab/iaas/make-network.sh` writes the template of the network from your parameters. It reads the interface that carries the VXLAN on node 1.

```bash
~/cc/lab/iaas/make-network.sh > ~/cc-lab/cc-net.tpl
onevnet create ~/cc-lab/cc-net.tpl
onevnet list
```

::code{file="lab/iaas/make-network.sh" lines="16-37"}

`VN_MAD` picks the driver, `PHYDEV` the interface on the nodes, `VLAN_ID` the VXLAN identifier and `BRIDGE` the name of the bridge on the nodes. `AR` is the address range from which OpenNebula hands out addresses to the VMs. The VMs receive `GATEWAY` and `DNS` through the context, as chapter 2.4 shows.

## Addresses and leases

OpenNebula hands out the addresses itself, without DHCP. When a VM starts, OpenNebula takes the next free address from the address range and records it as a lease. The VM receives address, gateway and DNS at boot through the context. `onevnet show` lists the addresses in use.

```bash
onevnet show cc-net
```

Since OpenNebula manages the addresses, a VM keeps its address for as long as it exists. When you delete it, the lease becomes free again.

## Network and gateway

The network `cc-net` and the service `cc-gateway` from chapter 0.4 belong together. On the nodes OpenNebula creates the bridge `ccbr` with your identifier and the VXLAN when the first VM starts. On the front-end `cc-gateway` has already set up the bridge `cc-br` with the gateway address and the same VXLAN. Packets from a VM to the internet thus travel through the VXLAN to the front-end, which sends them on to the lab network and the internet with NAT.

::::exercise[Lab]
Create the network `cc-net` with the script and compare `onevnet show cc-net` with the values in `/etc/cc-lab.env`. Which three values have to match for the gateway to work?

:::solution
The identifier `VLAN_ID` has to equal `CC_VNI`, the gateway `GATEWAY` has to be `CC_GUEST_GATEWAY`, and the addresses of the range have to lie within `CC_GUEST_NET`. Only then do the front-end and the VMs share the same VXLAN, and the NAT rule on the front-end covers the traffic of the VMs.
:::
::::

::::exercise[Network drivers]
Gemeinde Hinterbüel runs a small data center of its own with a switch that supports VLANs and is thinking about a cloud of its own. Which network driver would you recommend, and why?

:::solution
`802.1Q` fits because the switch provides VLANs. Each network gets its own VLAN, without the extra VXLAN header and without multicast on the network. VXLAN would work too, but it pays off mainly when the network underneath should not or cannot know about the VMs.
:::
::::
