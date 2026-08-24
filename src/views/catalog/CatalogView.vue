<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { catalogAdmin } from "../../api/catalogAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import { useToast } from "../../app/composables/useToast";
import AppCard from "../../components/ui/AppCard.vue";
import AppDataState from "../../components/ui/AppDataState.vue";
import AppDrawer from "../../components/ui/AppDrawer.vue";
import AppStatusBadge from "../../components/ui/AppStatusBadge.vue";
import JsonViewer from "../../components/ui/JsonViewer.vue";
import ReasonConfirmationDialog from "../../components/ui/ReasonConfirmationDialog.vue";

const props = defineProps({ section: String });
const { push } = useToast();
const data = ref(null);
const rows = ref([]);
const count = ref(0);
const loading = ref(true);
const error = ref(null);
const selected = ref(null);
const mutating = ref(false);
const filters = reactive({ query: "", status: "", page: 0, pageSize: 25 });
const confirmation = reactive({
  open: false,
  title: "",
  consequence: "",
  label: "Confirm",
  run: null,
});
const settings = reactive({
  freshnessDays: 30,
  curatorBatchSize: 5,
  leaseMinutes: 30,
  maxAttempts: 3,
  enqueueRateLimitPerHour: 20,
});
const title = computed(
  () =>
    ({
      overview: "Catalog overview",
      products: "Products & markets",
      queue: "Research queue",
      runs: "Research runs",
      settings: "Catalog settings",
    })[props.section],
);
async function load() {
  loading.value = true;
  error.value = null;
  try {
    data.value ||= await catalogAdmin.overview();
    const config = data.value?.configuration;
    if (config)
      Object.assign(settings, {
        freshnessDays: Number.parseInt(config.freshness_window) || 30,
        curatorBatchSize: config.curator_batch_size,
        leaseMinutes: intervalMinutes(config.lease_duration),
        maxAttempts: config.max_attempts,
        enqueueRateLimitPerHour: config.enqueue_rate_limit_per_hour,
      });
    if (props.section === "products") {
      const result = await catalogAdmin.products(filters);
      rows.value = result.products || [];
      count.value = result.count || 0;
    } else if (props.section === "queue") {
      const result = await catalogAdmin.queue(filters);
      rows.value = result.items || [];
      count.value = result.count || 0;
    } else if (props.section === "runs") {
      const result = await catalogAdmin.runs(filters);
      rows.value = result.runs || [];
      count.value = result.count || 0;
    }
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    loading.value = false;
  }
}
function intervalMinutes(value) {
  const parts = String(value || "00:30:00")
    .split(":")
    .map(Number);
  return Math.max(1, (parts[0] || 0) * 60 + (parts[1] || 0));
}
async function productDetail(item) {
  try {
    selected.value = await catalogAdmin.productDetail(item.id);
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  }
}
function ask(titleValue, consequence, label, run) {
  Object.assign(confirmation, {
    open: true,
    title: titleValue,
    consequence,
    label,
    run,
  });
}
async function confirm(reason) {
  mutating.value = true;
  try {
    await confirmation.run(reason);
    confirmation.open = false;
    push("Catalog operation accepted.", "success");
    await load();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
function reviewSettings() {
  const snapshot = { ...settings };
  ask(
    "Update catalog configuration",
    "Freshness, lease, retry, batch, and enqueue bounds affect future curator work. Existing immutable product versions are not changed.",
    "Update settings",
    (reason) => catalogAdmin.updateConfig(snapshot, reason),
  );
}
onMounted(load);
</script>
<template>
  <div class="page">
    <div class="page-intro">
      <div>
        <h2>{{ title }}</h2>
        <p>
          Global public product facts only; customer finance data is outside
          this boundary.
        </p>
      </div>
      <button class="button secondary" type="button" @click="load">
        Refresh
      </button>
    </div>
    <nav class="tabs-inline" aria-label="Catalog sections">
      <RouterLink to="/catalog/overview">Overview</RouterLink
      ><RouterLink to="/catalog/products">Products & Markets</RouterLink
      ><RouterLink to="/catalog/queue">Research Queue</RouterLink
      ><RouterLink to="/catalog/runs">Runs</RouterLink
      ><RouterLink to="/catalog/settings">Settings</RouterLink>
    </nav>
    <AppDataState :loading="loading" :error="error" @retry="load"
      ><template v-if="section === 'overview'"
        ><div class="metric-grid">
          <AppCard
            v-for="item in [
              ['Active products', data?.summary?.active_products],
              ['Due or stale', data?.summary?.due_or_stale],
              ['Queued', data?.summary?.queued],
              ['Leased', data?.summary?.leased],
              ['Failed', data?.summary?.failed],
              ['Countries', data?.summary?.countries],
              ['Conflicts', data?.summary?.conflicts],
              ['Unresolved', data?.summary?.unresolved],
            ]"
            :key="item[0]"
            class="metric-card"
            ><span>{{ item[0] }}</span
            ><strong>{{ item[1] ?? "—" }}</strong></AppCard
          >
        </div>
        <div class="split-grid">
          <AppCard title="Research contract"
            ><JsonViewer :value="data?.contract" /></AppCard
          ><AppCard title="Latest curator run"
            ><JsonViewer
              :value="data?.latestRun || { status: 'No runs returned' }"
          /></AppCard></div></template
      ><template v-else-if="section === 'products'"
        ><AppCard
          ><form
            class="filter-bar"
            @submit.prevent="
              filters.page = 0;
              load();
            "
          >
            <label class="field"
              ><span>Issuer or product</span
              ><input v-model.trim="filters.query" type="search" /></label
            ><label class="field"
              ><span>Status</span
              ><select v-model="filters.status">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="retired">Retired</option>
              </select></label
            ><button class="button primary" type="submit">Search</button>
          </form>
          <div class="table-wrap">
            <table>
              <caption>
                {{
                  count
                }}
                public catalog products
              </caption>
              <thead>
                <tr>
                  <th>Issuer / product</th>
                  <th>Market</th>
                  <th>Type / tier</th>
                  <th>Network / currency</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rows" :key="item.id">
                  <td>
                    <strong>{{ item.issuer_name }}</strong
                    ><br />{{ item.product_name }}
                  </td>
                  <td>{{ item.country_code }}</td>
                  <td>{{ item.account_type }} · {{ item.tier || "—" }}</td>
                  <td>
                    {{ item.network || "—" }} · {{ item.currency_code || "—" }}
                  </td>
                  <td><AppStatusBadge :status="item.status" /></td>
                  <td>
                    {{
                      item.verified_at
                        ? new Date(item.verified_at).toLocaleDateString()
                        : "—"
                    }}
                  </td>
                  <td>
                    <button
                      class="button secondary"
                      type="button"
                      @click="productDetail(item)"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div></AppCard
        ></template
      ><template v-else-if="section === 'queue'"
        ><AppCard title="Research work"
          ><template #actions
            ><button
              class="button primary"
              type="button"
              @click="
                ask(
                  'Enqueue due catalog research',
                  'The server applies freshness, rate-limit, and duplicate guards.',
                  'Enqueue due work',
                  (reason) => catalogAdmin.enqueueDue(reason),
                )
              "
            >
              Enqueue due
            </button></template
          >
          <div class="table-wrap">
            <table>
              <caption>
                {{
                  count
                }}
                queue items
              </caption>
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Lease / available</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rows" :key="item.id">
                  <td>{{ item.issuer_name }} · {{ item.product_name }}</td>
                  <td>{{ item.reason }}</td>
                  <td>{{ item.priority }}</td>
                  <td><AppStatusBadge :status="item.status" /></td>
                  <td>{{ item.attempts }}</td>
                  <td>{{ item.lease_expires_at || item.available_at }}</td>
                  <td>
                    <button
                      v-if="item.status === 'failed'"
                      class="button secondary"
                      type="button"
                      @click="
                        ask(
                          'Requeue research work',
                          'The server preserves max-attempt and freshness safeguards.',
                          'Requeue',
                          (reason) => catalogAdmin.requeue(item.id, reason),
                        )
                      "
                    >
                      Requeue
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div></AppCard
        ></template
      ><template v-else-if="section === 'runs'"
        ><AppCard title="Curator history"
          ><div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Task / type</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Completed</th>
                  <th>Changed</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rows" :key="item.id">
                  <td>{{ new Date(item.started_at).toLocaleString() }}</td>
                  <td>{{ item.task_name }} · {{ item.run_type }}</td>
                  <td><AppStatusBadge :status="item.status" /></td>
                  <td>{{ item.item_count }}</td>
                  <td>{{ item.completed_count }}</td>
                  <td>{{ item.changed_count }}</td>
                  <td>{{ item.failed_count }}</td>
                </tr>
              </tbody>
            </table>
          </div></AppCard
        ></template
      ><template v-else
        ><AppCard
          title="Catalog configuration"
          description="Changes apply to future curator work and are transactionally audited."
          ><div class="form-grid">
            <label class="field"
              ><span>Freshness window (days)</span
              ><input
                v-model.number="settings.freshnessDays"
                type="number"
                min="1"
                max="365" /></label
            ><label class="field"
              ><span>Curator batch size</span
              ><input
                v-model.number="settings.curatorBatchSize"
                type="number"
                min="1"
                max="50" /></label
            ><label class="field"
              ><span>Lease duration (minutes)</span
              ><input
                v-model.number="settings.leaseMinutes"
                type="number"
                min="1"
                max="1440" /></label
            ><label class="field"
              ><span>Max attempts</span
              ><input
                v-model.number="settings.maxAttempts"
                type="number"
                min="1"
                max="20" /></label
            ><label class="field"
              ><span>Enqueue limit / hour</span
              ><input
                v-model.number="settings.enqueueRateLimitPerHour"
                type="number"
                min="1"
                max="1000"
            /></label>
          </div>
          <button class="button primary" type="button" @click="reviewSettings">
            Review settings change
          </button></AppCard
        ></template
      ></AppDataState
    ><AppDrawer
      :open="Boolean(selected)"
      title="Catalog product detail"
      description="Immutable versions, provenance, and verification history."
      @close="selected = null"
      ><JsonViewer :value="selected" /></AppDrawer
    ><ReasonConfirmationDialog
      :open="confirmation.open"
      :title="confirmation.title"
      :consequence="confirmation.consequence"
      :confirm-label="confirmation.label"
      :loading="mutating"
      @close="confirmation.open = false"
      @confirm="confirm"
    />
  </div>
</template>
