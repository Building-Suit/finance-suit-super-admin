# Admin capability matrix

| Module                    | Read action            | Mutation action          | Backend authority               | Audited?  | Notes                           |
| ------------------------- | ---------------------- | ------------------------ | ------------------------------- | --------- | ------------------------------- |
| Access                    | `access_check`         | —                        | `commercial-admin`              | N/A       | Active `super_admin` only       |
| Overview                  | `overview`             | —                        | Admin function + aggregate RPCs | N/A       | Sanitized counts only           |
| Users                     | `users`, `user_detail` | grant/end/test access    | `commercial-admin`              | Yes       | No private finance records      |
| Plans/features            | `commercial_catalog`   | `update_entitlement`     | `commercial-admin`              | Yes       | Database keys only              |
| Pricing                   | `commercial_catalog`   | draft/publish/archive    | Transactional publish RPC       | Yes       | Integer minor units; sync guard |
| Campaigns                 | `commercial_catalog`   | `update_campaign`        | `commercial-admin`              | Yes       | Future grants only              |
| Monetization              | `commercial_catalog`   | duration/start/paid-live | Transactional lifecycle RPCs    | Yes       | Server-time guards              |
| Billing                   | `billing_events`       | —                        | `commercial-admin`              | N/A       | No raw provider payload         |
| App config                | `operations`           | `update_config`          | `commercial-admin`              | Yes       | Lifecycle mode blocked          |
| Announcements             | `operations`           | `save_announcement`      | `commercial-admin`              | Yes       | Date/enum validation            |
| Platform admins           | `operations`           | `update_platform_admin`  | Transactional RPC               | Yes       | Lockout safeguards              |
| Catalog overview/products | catalog reads          | —                        | Sanitized admin RPCs            | N/A       | Public product facts only       |
| Catalog queue             | `queue`                | enqueue due/requeue      | Approved catalog RPCs           | Yes       | Attempt/freshness guards        |
| Catalog settings          | `overview`             | `update_config`          | Transactional bounded RPC       | Yes       | Future curator work             |
| Notifications             | `health`               | self test                | Aggregate/test RPCs             | Test: yes | No FCM token exposure           |
| Audit                     | `audit_log`            | —                        | `commercial-admin`              | N/A       | Filters, pagination, CSV        |

Intentionally read-only:

- Google Play sync: no automated authoritative verifier is exposed.
- Billing retry/reverify: no safe idempotent admin action exists.
- Immutable catalog versions: direct edits violate the catalog model.
- Non-`super_admin` roles: their action matrix is not authoritatively defined.
