---
title: Sovereignty, law and cost
description: The Swiss Data Protection Act, sensitive personal data, processing on behalf, data abroad, professional secrecy, access by foreign authorities, protection needs and the cost of a cloud of your own.
sidebar:
  order: 4
---

:::assignment
Beat Kläy follows up. "Our members could simply go with one of the big providers. Write me one page on the legal reasons for a cloud of our own and what it costs us. I don't want to claim anything that isn't true."
:::

:::goals
After this chapter you can

- say which data protection law applies to the members of Wolkenwerk Bern,
- recognize sensitive personal data,
- explain the duties around processing on behalf and data abroad,
- judge what professional secrecy means for a medical practice in the cloud,
- roughly classify the protection needs of the members,
- divide the cost of a cloud of your own into investments and operating costs.
:::

:::caution
This chapter explains the legal situation for a case study, it is not legal advice. The articles of law are linked, and a real case needs a specialist. The information reflects the state of November 2026.
:::

## The Data Protection Act

Since 1 September 2023 Switzerland has had a revised [Federal Act on Data Protection](https://www.fedlex.admin.ch/eli/cc/2022/491/de) (FADP, SR 235.1, in German DSG). It applies to private persons and organizations and to federal bodies. Cantons and municipalities fall under the data protection law of their canton. At Wolkenwerk Bern, the cooperative, the practice, the fiduciary office and the bike shop fall under the FADP, while Gemeinde Hinterbüel falls under the data protection law of the canton of Bern.

The FADP defines sensitive personal data (Art. 5 let. c). They include data on health, on religious, philosophical or political views, genetic and biometric data, data on criminal proceedings and on social assistance measures. Praxis Rosenweg processes health data every day, the municipality data on social assistance.

## Data security and processing on behalf

Whoever processes personal data must protect it with technical and organizational measures appropriate to the risk (Art. 8 FADP). The minimum requirements are set out in the [Data Protection Ordinance](https://www.fedlex.admin.ch/eli/cc/2022/568/de) (DPO, in German DSV).

When Wolkenwerk Bern stores a member's data on its platform, the cooperative processes data on behalf of that member (Art. 9 FADP). The member stays responsible and has to make sure Wolkenwerk can guarantee data security. Wolkenwerk may process the data only as the member itself could and may bring in further service providers only with the member's prior approval. In practice a contract on processing on behalf covers this.

## Data abroad

Personal data may go abroad if the Federal Council has found that the destination offers adequate protection (Art. 16 FADP). The list of these countries is in Annex 1 of the DPO. The United States have been on it since 15 September 2024, but only for companies certified under the Swiss-U.S. Data Privacy Framework. Other countries and uncertified companies need other safeguards, such as standard contractual clauses, or one of the exceptions in Art. 17 FADP, like the express consent of the person concerned.

Regardless of where data is stored, the US [CLOUD Act](https://www.govinfo.gov/content/pkg/USCODE-2023-title18/html/USCODE-2023-title18-partI-chap121-sec2713.htm) of 2018 obliges US providers to disclose data in their possession, custody or control upon an order by the authorities, even when it sits in a data center in Switzerland.

## Professional secrecy

Doctors are bound by professional secrecy under [Art. 321 of the Swiss Criminal Code](https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de), together with their auxiliary persons. Disclosing such a secret can be punished with up to three years of imprisonment or a fine. Fiduciaries are not on this list. For Treuhand Aaregg, the contracts with its clients and the FADP apply.

Whether a cloud provider can count as an auxiliary person of a practice is a matter of interpretation. A page of the [canton of Zurich](https://www.zh.ch/de/wirtschaft-arbeit/wirtschaftsstandort/innovation-sandbox/phase-ii/medizinische-dokumentation/2-datenschutz-berufsgeheimnis-und-die-cloud.html) names two ways. Either the provider is bound to the same secrecy, works under instructions and is integrated into the practice by contract and organization, or it has no access to the keys that encrypt the data. For public bodies, the conference of Swiss data protection commissioners [privatim](https://www.privatim.ch/de/privatim-verabschiedet-resolution-zu-internationalen-cloud-losungen/) stated in 2025 that international cloud services are an option for sensitive data only if the body encrypts the data itself and the provider has no access to the key.

A community cloud like Wolkenwerk Bern has advantages here. The data stays in Switzerland, the cooperative is not subject to foreign law such as the CLOUD Act, and the members decide about it themselves.

## Protection needs

The protection need states how bad it would be if data became known, was altered or became unavailable. It is usually assessed for three security goals, confidentiality, integrity and availability, in levels such as normal, high and very high. The measures follow from it, such as encryption, separation of tenants, backups or a second site. Where processing poses a high risk to the people concerned, the FADP requires a data protection impact assessment in advance (Art. 22 FADP), for example when sensitive personal data is processed on a large scale.

## Cost

A cloud of your own first costs investments and then ongoing operating costs. Investments (CapEx) are expenses that create an asset, at Wolkenwerk the servers, the network equipment and the setup. Operating costs (OpEx) come up in every period, such as power, cooling, space in the data center, the internet connection, maintenance and above all the working time of the platform team. OpenNebula, Kubernetes and the other tools of the course cost no license fees because they are free software. A public cloud consists almost entirely of operating costs, billed by usage.

The total cost over several years is called the total cost of ownership. Knowing it helps when comparing with an offer from a public cloud. So that members see their share, Wolkenwerk measures usage per member. If the cooperative shows members their usage for information only, that is called showback. If it bills them for it, that is chargeback. The [FinOps Foundation](https://www.finops.org/framework/capabilities/invoicing-chargeback/) notes that showback is needed in every organization, while chargeback depends on its accounting rules. In chapter 3.3 you set up showback in OpenNebula.

::::exercise[Protection needs]
Rate the protection need of every member for confidentiality, integrity and availability as normal, high or very high, and justify each rating in one sentence.

:::solution
One possible rating:

| Member | Confidentiality | Integrity | Availability |
|---|---|---|---|
| Praxis Rosenweg | very high, health data under professional secrecy | high, wrong findings put patients at risk | high, no consultations without data |
| Treuhand Aaregg | high, financial data of clients | high, accounts have to be correct | high at the end of the month, otherwise normal |
| Veloatelier Matte | normal, mainly orders and addresses | normal | high on spring Saturdays |
| Gemeinde Hinterbüel | high, data on residents, partly on social assistance | high, official records | high during counter hours |
:::
::::

::::exercise[Briefing]
Write one page for Beat Kläy with the legal reasons for a cloud of your own and a breakdown of the costs. Use only statements you can support with an article of law or a source from this chapter.

:::solution
A good page names the FADP and, for the municipality, cantonal law, the practice's health data as sensitive, the role of Wolkenwerk as a processor on behalf with a contract, the rules for data abroad, the CLOUD Act as a risk with US providers and the professional secrecy of the practice. On cost it separates investments and operating costs, names the working time of the platform team as the largest ongoing item and explains showback.
:::
::::
