# 👑 Apex v2 Super Admin: Platform Governance (God View)

This document defines the **Super Admin Dashboard** (Platform Owner View). This is "The Control Tower" for the entire SaaS ecosystem, enabling ultimate governance, security, and financial control over all tenants.

---

## 🏛️ 1. Tenant Governance (The Kingdom)
*Control over the lifecycle of every store on the platform.*

| # | Feature | Functionality | Compliance/Governance Purpose |
| :--- | :--- | :--- | :--- |
| **01** | **Tenant Overview** | Searchable table of all stores, statuses (Active/Suspended), and Plans. | Total visibility of client base. |
| **02** | **God Mode (Impersonation)** | **One-click login** into any tenant's dashboard as support. | Infinite support capability without password sharing. |
| **03** | **Kill Switch** | Suspend/Ban a tenant instantly. | Emergency response to TOS violations or fraud. |
| **04** | **Resource Quotas** | Hard limits on Products/Storage/Bandwidth per tenant. | Prevent "Noisy Neighbor" effect where one client slows down the server. |
| **05** | **Domain Manager** | Approve/Reject custom domains requested by tenants. | Prevent abuse and ensure SSL propagation. |

---

## 💳 2. Financial Governance (The Treasury)
*Managing the flow of money from Tenants to Platform.*

| # | Feature | Functionality | Compliance/Governance Purpose |
| :--- | :--- | :--- | :--- |
| **06** | **Global Plan Manager** | Create/Edit SaaS Tiers (Basic @ $29, Pro @ $79). | Agile pricing strategy management. |
| **07** | **Feature gating** | Map features (e.g., "AI Writer") to specific Plans only. | Monetization of premium features. |
| **08** | **Global Invoicing** | Auto-gen invoices for subscription fees + Commission. | Automated revenue collection and tax compliance. |
| **09** | **Dunning Management** | Rules for failed payments (Retry 3x -> Suspend Store). | Revenue protection/Churn reduction. |
| **10** | **Manual Credits** | Grant free months or wallet credit to tenants. | Customer service recovery and refunds. |

---

## 🛡️ 3. Security & Compliance (The Shield)
*Centralized security controls.*

| # | Feature | Functionality | Compliance/Governance Purpose |
| :--- | :--- | :--- | :--- |
| **11** | **Global Audit Log** | Immutable record of EVERY Super Admin action. | "Who banned this store?" accountability. |
| **12** | **Feature Flags** | Toggle features ON/OFF system-wide instantly. | Risk mitigation during new deployments. |
| **13** | **Compliance Vault** | Repository of signed TOS agreements per tenant. | Legal protection and audit trail. |
| **14** | **Blocked List** | Global blacklist for IPs, Emails, and Domains. | Platform-wide firewall against known bad actors. |

---

## 🚦 4. Infrastructure Health (The Pulse)
*Real-time system monitoring.*

| # | Feature | Functionality | Compliance/Governance Purpose |
| :--- | :--- | :--- | :--- |
| **15** | **System Status** | Live view of CPU, RAM, Postgres Connections. | Proactive uptime assurance. |
| **16** | **Queue Monitor** | Visualize Redis Queues (Emails, Jobs). | Prevent silent failures in background tasks. |
| **17** | **Error Aggregator** | Central dashboard for platform-wide 500 errors. | Rapid bug triage and fixing. |
| **18** | **Database Snapshots** | Trigger manual backups of specific tenants. | Disaster recovery assurance. |

---

## 📣 5. Communication & Operations (The Voice)
*Reaching out to the kingdom.*

| # | Feature | Functionality | Compliance/Governance Purpose |
| :--- | :--- | :--- | :--- |
| **19** | **Global Broadcast** | Banner message shown on all Tenant Dashboards. | Communicating downtime or critical updates. |
| **20** | **Maintenance Mode** | Switch entire platform to "Updating..." page. | Controlled deployment windows. |
| **21** | **Onboarding Blueprint** | Edit the default "Starter Data" for new stores. | Ensuring quality "Day 1" experience for new users. |

---

---

## 🌐 6. Marketing Site CMS (The Face)
*Managing the Apex Landing Page content.*

| # | Feature | Functionality | Compliance/Governance Purpose |
| :--- | :--- | :--- | :--- |
| **22** | **Page Builder** | Drag & Drop editor for Home, Pricing, and About pages. | Marketing agility without dev dependency. |
| **23** | **Blog Board** | Write and publish SEO articles/news. | Content marketing and traffic growth. |
| **24** | **Case Studies** | Manage "Success Stories" (Client logo + Testimonial). | Building trust with new leads. |
| **25** | **Lead CRM** | View email list captured from Hero Section/Newsletter. | Sales pipeline for enterprise deals. |
| **26** | **Global Menu** | Edit Header/Footer links of the main site. | Navigation control. |

### 🚀 Governance Summary
This dashboard provides **Infinite Governance** by decoupling the **Business Logic of the Platform** (Pricing, Plans, Features) from the **Code**. You can change the price, ban a user, or disable a feature without deploying a single line of code.
