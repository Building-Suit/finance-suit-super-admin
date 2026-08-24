<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { commercialAdmin } from "../../api/commercialAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import { useToast } from "../../app/composables/useToast";
import AppCard from "../../components/ui/AppCard.vue";
import AppDataState from "../../components/ui/AppDataState.vue";
import AppStatusBadge from "../../components/ui/AppStatusBadge.vue";
import AppModal from "../../components/ui/AppModal.vue";
import ReasonConfirmationDialog from "../../components/ui/ReasonConfirmationDialog.vue";
import { toMinorUnits } from "../../utils/adminValidation";

const props = defineProps({ section: String });
const data = ref(null);
const loading = ref(true);
const error = ref(null);
const mutating = ref(false);
const { push } = useToast();
const billing = ref({ events: [], count: 0, page: 0, pageSize: 25 });
const billingLoading = ref(false);
const durationDays = ref(90);
const confirmation = reactive({
  open: false,
  title: "",
  consequence: "",
  label: "Confirm",
  destructive: false,
  run: null,
});
const priceModal = ref(false);
const price = reactive({
  id: "",
  planKey: "pro",
  interval: "month",
  amount: "",
  currencyCode: "EGP",
  provider: "google_play",
  providerProductId: "",
  providerBasePlanId: "",
  effectiveFrom: "",
  reason: "",
});
const activeTitle = computed(
  () =>
    ({
      plans: "Plans & feature entitlements",
      pricing: "Pricing lifecycle",
      campaigns: "Trials & campaigns",
      monetization: "Monetization lifecycle",
      billing: "Billing & Google Play",
    })[props.section],
);
async function load() {
  loading.value = true;
  error.value = null;
  try {
    data.value = await commercialAdmin.commercialCatalog();
    durationDays.value =
      data.value?.monetization?.configured_duration_days || 90;
    if (props.section === "billing") await loadBilling();
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    loading.value = false;
  }
}
async function loadBilling() {
  billingLoading.value = true;
  try {
    billing.value = await commercialAdmin.billingEvents(billing.value);
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    billingLoading.value = false;
  }
}
function ask(title, consequence, label, run, destructive = false) {
  Object.assign(confirmation, {
    open: true,
    title,
    consequence,
    label,
    run,
    destructive,
  });
}
async function confirm(reason) {
  mutating.value = true;
  try {
    await confirmation.run(reason);
    confirmation.open = false;
    push("Commercial state updated.", "success");
    await load();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
function toggleEntitlement(row) {
  ask(
    "Update plan entitlement",
    `This changes ${row.feature_key} for the ${row.plan_key} plan. The application reads this matrix at runtime.`,
    "Update entitlement",
    (reason) =>
      commercialAdmin.updateEntitlement({
        planKey: row.plan_key,
        featureKey: row.feature_key,
        enabled: !row.enabled,
        limitValue: row.limit_value,
        config: row.config || {},
        reason,
      }),
  );
}
function editCampaign(item) {
  const days = Number(item._duration ?? item.duration_days);
  ask(
    "Update campaign",
    "This changes defaults for future grants only; historical grants are not rewritten.",
    "Save campaign",
    (reason) =>
      commercialAdmin.updateCampaign({
        campaignKey: item.key,
        active: item._active ?? item.active,
        durationDays: days,
        reason,
      }),
  );
}
function openPrice(item = null) {
  Object.assign(price, {
    id: item?.id || "",
    planKey: item?.plan_key || "pro",
    interval: item?.interval || "month",
    amount: item ? String(item.amount_minor / 100) : "",
    currencyCode: item?.currency_code || "EGP",
    provider: item?.provider || "google_play",
    providerProductId: item?.provider_product_id || "",
    providerBasePlanId: item?.provider_base_plan_id || "",
    effectiveFrom: item?.effective_from?.slice(0, 16) || "",
    reason: "",
  });
  priceModal.value = true;
}
async function savePrice() {
  let amountMinor;
  try {
    amountMinor = toMinorUnits(price.amount);
  } catch {
    push("Enter a positive amount with at most two decimal places.", "error");
    return;
  }
  if (price.reason.trim().length < 6) return;
  mutating.value = true;
  try {
    await commercialAdmin.savePrice({
      priceId: price.id || undefined,
      planKey: price.planKey,
      interval: price.interval,
      amountMinor,
      currencyCode: price.currencyCode,
      provider: price.provider,
      providerProductId: price.providerProductId,
      providerBasePlanId: price.providerBasePlanId,
      effectiveFrom: price.effectiveFrom
        ? new Date(price.effectiveFrom).toISOString()
        : undefined,
      reason: price.reason.trim(),
    });
    priceModal.value = false;
    push("Price draft saved.", "success");
    await load();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
function money(item) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: item.currency_code,
  }).format(item.amount_minor / 100);
}
onMounted(load);
</script>
<template>
  <div class="page">
    <div class="page-intro">
      <div>
        <h2>{{ activeTitle }}</h2>
        <p>Every mutation is server-validated, reasoned, and audited.</p>
      </div>
      <button class="button secondary" type="button" @click="load">
        Refresh
      </button>
    </div>
    <nav class="tabs-inline" aria-label="Commercial sections">
      <RouterLink to="/commercial/plans">Plans & Features</RouterLink
      ><RouterLink to="/commercial/pricing">Pricing</RouterLink
      ><RouterLink to="/commercial/campaigns">Trials & Campaigns</RouterLink
      ><RouterLink to="/commercial/monetization">Monetization</RouterLink
      ><RouterLink to="/commercial/billing">Billing & Google Play</RouterLink>
    </nav>
    <AppDataState :loading="loading" :error="error" @retry="load"
      ><template v-if="section === 'plans'"
        ><div class="split-grid">
          <AppCard title="Plans"
            ><div
              v-for="item in data?.plans || []"
              :key="item.key"
              class="record-row"
            >
              <div>
                <strong>{{ item.display_name }}</strong
                ><span>{{ item.key }} · {{ item.description }}</span>
              </div>
              <AppStatusBadge
                :status="item.enabled ? 'active' : 'inactive'"
              /></div></AppCard
          ><AppCard title="Features"
            ><div
              v-for="item in data?.features || []"
              :key="item.key"
              class="record-row"
            >
              <div>
                <strong>{{ item.title }}</strong
                ><span>{{ item.key }} · {{ item.value_type }}</span>
              </div>
              <AppStatusBadge
                :status="item.active ? 'active' : 'inactive'"
              /></div
          ></AppCard>
        </div>
        <AppCard
          title="Entitlement matrix"
          description="Free and Pro behavior comes from database values."
          ><div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Feature</th>
                  <th>Type</th>
                  <th>Enabled</th>
                  <th>Limit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in data?.entitlements || []"
                  :key="`${row.plan_key}:${row.feature_key}`"
                >
                  <td>{{ row.plan_key }}</td>
                  <td>{{ row.feature_key }}</td>
                  <td>
                    {{
                      data.features?.find((i) => i.key === row.feature_key)
                        ?.value_type
                    }}
                  </td>
                  <td><AppStatusBadge :status="row.enabled" /></td>
                  <td>{{ row.limit_value ?? "—" }}</td>
                  <td>
                    <button
                      class="button secondary"
                      type="button"
                      @click="toggleEntitlement(row)"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div></AppCard
        ></template
      ><template v-if="section === 'pricing'"
        ><AppCard
          title="Price catalog"
          description="Amounts are stored as integer minor units. Publishing requires verified provider sync."
          ><template #actions
            ><button class="button primary" type="button" @click="openPrice()">
              Create draft
            </button></template
          >
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Interval</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Provider sync</th>
                  <th>Effective</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data?.prices || []" :key="item.id">
                  <td>{{ item.plan_key }}</td>
                  <td>{{ item.interval }}</td>
                  <td>{{ money(item) }}</td>
                  <td><AppStatusBadge :status="item.status" /></td>
                  <td>
                    <AppStatusBadge :status="item.provider_sync_status" />
                  </td>
                  <td>
                    {{
                      item.effective_from
                        ? new Date(item.effective_from).toLocaleString()
                        : "—"
                    }}
                  </td>
                  <td>
                    <div class="inline-actions">
                      <button
                        v-if="item.status === 'draft'"
                        class="button secondary"
                        type="button"
                        @click="openPrice(item)"
                      >
                        Edit</button
                      ><button
                        v-if="item.status === 'draft'"
                        class="button primary"
                        type="button"
                        :disabled="item.provider_sync_status !== 'synced'"
                        @click="
                          ask(
                            'Publish price',
                            'Publishing makes this the current price and archives the previous published record. Google Play must already be verified.',
                            'Publish price',
                            (reason) =>
                              commercialAdmin.publishPrice({
                                priceId: item.id,
                                reason,
                              }),
                          )
                        "
                      >
                        Publish</button
                      ><button
                        v-if="item.status !== 'archived'"
                        class="button secondary danger-text"
                        type="button"
                        @click="
                          ask(
                            'Archive price',
                            'Historical data is retained, but this price will no longer be usable.',
                            'Archive price',
                            (reason) =>
                              commercialAdmin.archivePrice({
                                priceId: item.id,
                                reason,
                              }),
                            true,
                          )
                        "
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="notice warning">
            Provider state can only become synced after external Play Console
            verification. This dashboard never fakes that result.
          </p></AppCard
        ></template
      ><template v-if="section === 'campaigns'"
        ><AppCard
          title="Campaigns"
          description="Edits affect future grants only."
          ><div
            v-for="item in data?.campaigns || []"
            :key="item.id"
            class="campaign-row"
          >
            <div>
              <strong>{{ item.name }}</strong
              ><span
                >{{ item.key }} · {{ item.campaign_type }} ·
                {{ item.plan_key }}</span
              >
            </div>
            <label class="field"
              ><span>Duration days</span
              ><input
                v-model.number="item._duration"
                type="number"
                min="1"
                max="3650"
                :placeholder="String(item.duration_days)" /></label
            ><label class="field"
              ><span>Status</span
              ><select v-model="item._active">
                <option :value="undefined">
                  Unchanged ({{ item.active ? "active" : "inactive" }})
                </option>
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select></label
            ><button
              class="button secondary"
              type="button"
              @click="editCampaign(item)"
            >
              Review change
            </button>
          </div></AppCard
        ></template
      ><template v-if="section === 'monetization'"
        ><AppCard title="Lifecycle state"
          ><div class="lifecycle">
            <div>
              <AppStatusBadge status="open_early_access" /><span
                >No countdown or payment requirement</span
              >
            </div>
            <div>
              <AppStatusBadge status="timed_early_access" /><span
                >Timed cohort begins at server time</span
              >
            </div>
            <div>
              <AppStatusBadge status="paid_live" /><span
                >Paid subscription path is live</span
              >
            </div>
          </div>
          <div class="notice">
            <strong>Current mode: {{ data?.monetization?.mode }}</strong>
            <p>
              Configured duration:
              {{ data?.monetization?.configured_duration_days }} days · Ends:
              {{
                data?.monetization?.timed_early_access_ends_at ||
                "Not scheduled"
              }}
            </p>
          </div>
          <div
            v-if="data?.monetization?.mode === 'open_early_access'"
            class="duration-control"
          >
            <label class="field"
              ><span>Timed Early Access duration (days)</span
              ><input
                v-model.number="durationDays"
                type="number"
                min="1"
                max="3650" /></label
            ><button
              class="button secondary"
              type="button"
              @click="
                ask(
                  'Update timed duration',
                  'This sets the duration used when the monetization cycle starts. It is separate from campaign defaults and the standard trial.',
                  'Update duration',
                  (reason) =>
                    commercialAdmin.updateMonetizationDuration({
                      durationDays,
                      reason,
                    }),
                )
              "
            >
              Update duration
            </button>
          </div>
          <div class="inline-actions">
            <button
              v-if="data?.monetization?.mode === 'open_early_access'"
              class="button primary"
              type="button"
              @click="
                ask(
                  'Start Monetization Cycle',
                  `This starts a ${data.monetization.configured_duration_days}-day Early Access cohort using server time. Existing open access becomes time-limited. Future campaign defaults remain separate.`,
                  'Start cycle',
                  (reason) => commercialAdmin.startMonetization(reason),
                  true,
                )
              "
            >
              Start Monetization Cycle</button
            ><button
              v-if="data?.monetization?.mode === 'timed_early_access'"
              class="button danger"
              type="button"
              @click="
                ask(
                  'Transition to Paid Live',
                  'This transition is permitted only when the timed Early Access window has ended. The server enforces time and current-state guards.',
                  'Activate Paid Live',
                  (reason) => commercialAdmin.transitionPaidLive(reason),
                  true,
                )
              "
            >
              Transition to Paid Live
            </button>
          </div></AppCard
        ></template
      ><template v-if="section === 'billing'"
        ><div class="split-grid">
          <AppCard title="Google Play configuration"
            ><div
              v-for="item in data?.provider || []"
              :key="item.provider"
              class="summary-list"
            >
              <span>Status<AppStatusBadge :status="item.status" /></span
              ><span
                >Package<strong class="technical-id">{{
                  item.package_name
                }}</strong></span
              ><span
                >Last successful sync<strong>{{
                  item.last_synced_at
                    ? new Date(item.last_synced_at).toLocaleString()
                    : "Never"
                }}</strong></span
              ><span
                >Last error<strong>{{
                  item.last_error || "None recorded"
                }}</strong></span
              >
            </div>
            <p class="notice warning">
              Service-account JSON, OAuth credentials, purchase tokens, and RTDN
              secrets are never returned.
            </p></AppCard
          ><AppCard title="Provider readiness"
            ><div
              v-for="item in data?.prices || []"
              :key="item.id"
              class="record-row"
            >
              <div>
                <strong
                  >{{ item.interval }} · {{ item.provider_product_id }}</strong
                ><span class="technical-id">{{
                  item.provider_base_plan_id
                }}</span>
              </div>
              <AppStatusBadge :status="item.provider_sync_status" /></div
          ></AppCard>
        </div>
        <AppCard title="Billing event diagnostics"
          ><AppDataState
            :loading="billingLoading"
            :empty="!billing.events.length"
            ><div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>User / subscription</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in billing.events" :key="item.id">
                    <td>{{ new Date(item.received_at).toLocaleString() }}</td>
                    <td>{{ item.provider }}</td>
                    <td>{{ item.event_type }}</td>
                    <td class="technical-id">
                      {{ item.user_id || item.subscription_id || "—" }}
                    </td>
                    <td><AppStatusBadge :status="item.processing_result" /></td>
                  </tr>
                </tbody>
              </table></div></AppDataState></AppCard></template></AppDataState
    ><AppModal
      :open="priceModal"
      title="Price draft"
      description="Human EGP is converted to integer minor units before the server request."
      @close="priceModal = false"
      ><div class="form-grid">
        <label class="field"
          ><span>Plan</span
          ><select v-model="price.planKey">
            <option value="pro">Pro</option>
          </select></label
        ><label class="field"
          ><span>Interval</span
          ><select v-model="price.interval">
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select></label
        ><label class="field"
          ><span>Amount (EGP)</span
          ><input v-model="price.amount" inputmode="decimal" /></label
        ><label class="field"
          ><span>Effective from</span
          ><input v-model="price.effectiveFrom" type="datetime-local" /></label
        ><label class="field full"
          ><span>Google Play product ID</span
          ><input
            v-model.trim="price.providerProductId"
            class="technical-id" /></label
        ><label class="field full"
          ><span>Base plan ID</span
          ><input
            v-model.trim="price.providerBasePlanId"
            class="technical-id" /></label
        ><label class="field full"
          ><span>Administrative reason</span
          ><textarea
            v-model="price.reason"
            rows="3"
            minlength="6"
            maxlength="1000"
          />
        </label>
      </div>
      <footer class="modal-actions">
        <button
          class="button secondary"
          type="button"
          @click="priceModal = false"
        >
          Cancel</button
        ><button
          class="button primary"
          type="button"
          :disabled="
            mutating ||
            price.reason.trim().length < 6 ||
            !(Number(price.amount) > 0)
          "
          @click="savePrice"
        >
          Save draft
        </button>
      </footer></AppModal
    ><ReasonConfirmationDialog
      :open="confirmation.open"
      :title="confirmation.title"
      :consequence="confirmation.consequence"
      :confirm-label="confirmation.label"
      :destructive="confirmation.destructive"
      :loading="mutating"
      @close="confirmation.open = false"
      @confirm="confirm"
    />
  </div>
</template>
<style scoped>
.record-row,
.summary-list span,
.campaign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-block-end: 1px solid var(--bs-border);
}
.record-row > div,
.campaign-row > div {
  display: grid;
  margin-inline-end: auto;
}
.record-row span,
.campaign-row span {
  color: var(--bs-text-muted);
  font-size: 12px;
}
.campaign-row .field {
  min-width: 140px;
}
.lifecycle {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-block-end: 16px;
}
.lifecycle > div {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: var(--bs-radius-button);
  background: var(--bs-surface-muted);
}
.lifecycle span {
  color: var(--bs-text-muted);
}
.duration-control {
  display: flex;
  align-items: end;
  gap: 10px;
  margin-block: 16px;
}
.duration-control .field {
  max-width: 260px;
}
@media (max-width: 760px) {
  .campaign-row,
  .duration-control {
    align-items: stretch;
    flex-direction: column;
  }
  .campaign-row > div {
    margin: 0;
  }
  .lifecycle {
    grid-template-columns: 1fr;
  }
}
</style>
