<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { commercialAdmin } from "../../api/commercialAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import { useToast } from "../../app/composables/useToast";
import AppCard from "../../components/ui/AppCard.vue";
import AppDataState from "../../components/ui/AppDataState.vue";
import AppDrawer from "../../components/ui/AppDrawer.vue";
import AppStatusBadge from "../../components/ui/AppStatusBadge.vue";
import ReasonConfirmationDialog from "../../components/ui/ReasonConfirmationDialog.vue";

const filters = reactive({ query: "", page: 0, pageSize: 25, sort: "desc" });
const users = ref([]);
const count = ref(0);
const loading = ref(false);
const error = ref(null);
const selected = ref(null);
const detailLoading = ref(false);
const detailError = ref(null);
const mutating = ref(false);
const confirmation = reactive({
  open: false,
  kind: "",
  target: null,
  title: "",
  consequence: "",
  confirmLabel: "Confirm",
  destructive: false,
});
const grant = reactive({ permanent: true, endsAt: "", reason: "" });
const { push } = useToast();
const pageCount = computed(() =>
  Math.max(1, Math.ceil(count.value / filters.pageSize)),
);
async function load() {
  loading.value = true;
  error.value = null;
  try {
    const result = await commercialAdmin.users(filters);
    users.value = result.users || [];
    count.value = result.count || 0;
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    loading.value = false;
  }
}
async function search() {
  filters.page = 0;
  await load();
}
async function openUser(user) {
  detailLoading.value = true;
  detailError.value = null;
  selected.value = { profile: user };
  try {
    selected.value = await commercialAdmin.userDetail(user.id);
  } catch (value) {
    detailError.value = normalizeAdminError(value);
  } finally {
    detailLoading.value = false;
  }
}
async function refreshDetail() {
  if (selected.value?.profile?.id) await openUser(selected.value.profile);
}
async function grantPro() {
  if (grant.reason.trim().length < 6) return;
  mutating.value = true;
  try {
    await commercialAdmin.grantPro({
      userId: selected.value.profile.id,
      permanent: grant.permanent,
      endsAt: grant.permanent
        ? undefined
        : new Date(grant.endsAt).toISOString(),
      reason: grant.reason.trim(),
    });
    grant.reason = "";
    push("Complimentary Pro granted.", "success");
    await refreshDetail();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
function ask(kind, target) {
  Object.assign(
    confirmation,
    kind === "grant"
      ? {
          open: true,
          kind,
          target,
          title: "End complimentary grant",
          consequence: `This ends the active ${target.source} grant${target.ends_at ? ` currently expiring ${new Date(target.ends_at).toLocaleString()}` : " with no expiry"}. The user's effective plan will be recalculated.`,
          confirmLabel: "End grant",
          destructive: true,
        }
      : {
          open: true,
          kind,
          target,
          title: `${target ? "Disable" : "Enable"} Billing Test Access`,
          consequence:
            "This changes access to test checkout only. It does not grant or remove Pro.",
          confirmLabel: target ? "Disable access" : "Enable access",
          destructive: Boolean(target),
        },
  );
}
async function confirm(reason) {
  mutating.value = true;
  try {
    if (confirmation.kind === "grant")
      await commercialAdmin.endGrant({
        grantId: confirmation.target.id,
        reason,
      });
    else
      await commercialAdmin.setBillingTestAccess({
        userId: selected.value.profile.id,
        enabled: !confirmation.target,
        reason,
      });
    confirmation.open = false;
    push("User access updated.", "success");
    await refreshDetail();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
onMounted(load);
</script>
<template>
  <div class="page">
    <div class="page-intro">
      <div>
        <h2>User administration</h2>
        <p>
          Commercial and entitlement data only. Private finance records are
          never queried.
        </p>
      </div>
    </div>
    <AppCard
      ><form class="filter-bar" @submit.prevent="search">
        <label class="field"
          ><span>Display name or exact profile UUID</span
          ><input
            v-model.trim="filters.query"
            type="search"
            placeholder="Search users" /></label
        ><label class="field"
          ><span>Page size</span
          ><select v-model.number="filters.pageSize" @change="search">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select></label
        ><label class="field"
          ><span>Created</span
          ><select v-model="filters.sort" @change="search">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select></label
        ><button class="button primary" type="submit">Search</button>
      </form>
      <AppDataState
        :loading="loading"
        :error="error"
        :empty="!users.length"
        empty-title="No users found"
        @retry="load"
        ><div class="table-wrap">
          <table>
            <caption>
              {{
                count
              }}
              users found
            </caption>
            <thead>
              <tr>
                <th>Display name</th>
                <th>Profile ID</th>
                <th>Created</th>
                <th><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.display_name || "Unnamed user" }}</td>
                <td class="technical-id">{{ user.id }}</td>
                <td>{{ new Date(user.created_at).toLocaleString() }}</td>
                <td>
                  <button
                    class="button secondary"
                    type="button"
                    @click="openUser(user)"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>Page {{ filters.page + 1 }} of {{ pageCount }}</span>
          <div class="inline-actions">
            <button
              class="button secondary"
              type="button"
              :disabled="filters.page === 0"
              @click="
                filters.page--;
                load();
              "
            >
              Previous</button
            ><button
              class="button secondary"
              type="button"
              :disabled="filters.page + 1 >= pageCount"
              @click="
                filters.page++;
                load();
              "
            >
              Next
            </button>
          </div>
        </div></AppDataState
      ></AppCard
    ><AppDrawer
      :open="Boolean(selected)"
      :title="selected?.profile?.display_name || 'User details'"
      description="Administrative and commercial history only."
      @close="selected = null"
      ><AppDataState
        :loading="detailLoading"
        :error="detailError"
        @retry="refreshDetail"
        ><template v-if="selected"
          ><div class="detail-summary">
            <div>
              <span>Profile ID</span
              ><strong class="technical-id">{{ selected.profile?.id }}</strong>
            </div>
            <div>
              <span>Effective plan</span
              ><AppStatusBadge
                :status="selected.entitlement?.effective_plan || 'free'"
              />
            </div>
            <div>
              <span>Source</span
              ><strong>{{ selected.entitlement?.source || "free" }}</strong>
            </div>
            <div>
              <span>Ends</span
              ><strong>{{
                selected.entitlement?.ends_at
                  ? new Date(selected.entitlement.ends_at).toLocaleString()
                  : "No expiration"
              }}</strong>
            </div>
          </div>
          <div class="notice">
            <strong>Billing Test Access</strong>
            <p>Test checkout access does not grant Pro.</p>
            <button
              class="button secondary"
              type="button"
              @click="ask('billing', Boolean(selected.billingTester?.enabled))"
            >
              {{ selected.billingTester?.enabled ? "Disable" : "Enable" }}
            </button>
          </div>
          <section class="detail-section">
            <h3>Grant Complimentary Pro</h3>
            <div class="form-grid">
              <label class="field full"
                ><span>Reason</span
                ><input
                  v-model="grant.reason"
                  minlength="6"
                  maxlength="1000" /></label
              ><label class="field"
                ><span>Duration</span
                ><select v-model="grant.permanent">
                  <option :value="true">Permanent</option>
                  <option :value="false">Explicit end date</option>
                </select></label
              ><label v-if="!grant.permanent" class="field"
                ><span>Ends at</span
                ><input v-model="grant.endsAt" type="datetime-local"
              /></label>
            </div>
            <button
              class="button primary"
              type="button"
              :disabled="
                mutating ||
                grant.reason.trim().length < 6 ||
                (!grant.permanent && !grant.endsAt)
              "
              @click="grantPro"
            >
              Grant Pro
            </button>
          </section>
          <section class="detail-section">
            <h3>Grant history</h3>
            <div
              v-for="item in selected.grants || []"
              :key="item.id"
              class="detail-row"
            >
              <div>
                <strong>{{ item.source }}</strong
                ><span>{{
                  item.ends_at
                    ? new Date(item.ends_at).toLocaleString()
                    : "No expiration"
                }}</span>
              </div>
              <AppStatusBadge :status="item.status" /><button
                v-if="item.source === 'admin_grant' && item.status === 'active'"
                class="button secondary danger-text"
                type="button"
                @click="ask('grant', item)"
              >
                End grant
              </button>
            </div>
            <p v-if="!(selected.grants || []).length">No grant history.</p>
          </section>
          <section class="detail-section">
            <h3>Billing timeline</h3>
            <div class="timeline">
              <div
                v-for="item in [
                  ...(selected.subscriptions || []),
                  ...(selected.billingEvents || []),
                ]"
                :key="item.id"
                class="timeline-item"
              >
                <strong>{{ item.event_type || item.provider }}</strong>
                <p>
                  {{ item.processing_result || item.status }} ·
                  {{
                    new Date(
                      item.received_at ||
                        item.last_verified_at ||
                        item.expires_at,
                    ).toLocaleString()
                  }}
                </p>
              </div>
            </div>
            <p
              v-if="
                !(selected.subscriptions || []).length &&
                !(selected.billingEvents || []).length
              "
            >
              No billing diagnostics. Reverification is read-only because no
              safe idempotent retry API exists.
            </p>
          </section></template
        ></AppDataState
      ></AppDrawer
    ><ReasonConfirmationDialog
      :open="confirmation.open"
      :title="confirmation.title"
      :consequence="confirmation.consequence"
      :confirm-label="confirmation.confirmLabel"
      :destructive="confirmation.destructive"
      :loading="mutating"
      @close="confirmation.open = false"
      @confirm="confirm"
    />
  </div>
</template>
<style scoped>
.detail-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.detail-summary > div {
  display: grid;
  gap: 3px;
  padding: 12px;
  border-radius: var(--bs-radius-button);
  background: var(--bs-surface-muted);
}
.detail-summary span,
.detail-row span {
  color: var(--bs-text-muted);
  font-size: 12px;
}
.detail-section {
  display: grid;
  gap: 12px;
  padding-block-start: 16px;
  border-block-start: 1px solid var(--bs-border);
}
.detail-section h3 {
  margin: 0;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-block-end: 1px solid var(--bs-border);
}
.detail-row > div {
  display: grid;
  margin-inline-end: auto;
}
@media (max-width: 500px) {
  .detail-summary {
    grid-template-columns: 1fr;
  }
  .detail-row {
    align-items: stretch;
    flex-direction: column;
  }
  .detail-row > div {
    margin: 0;
  }
}
</style>
