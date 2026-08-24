<script setup>
import { computed, onMounted, ref } from "vue";
import { commercialAdmin } from "../../api/commercialAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import AppCard from "../../components/ui/AppCard.vue";
import AppDataState from "../../components/ui/AppDataState.vue";
import AppStatusBadge from "../../components/ui/AppStatusBadge.vue";

const data = ref(null);
const loading = ref(true);
const error = ref(null);
const metrics = computed(() => data.value?.overview || {});
async function load() {
  loading.value = true;
  error.value = null;
  try {
    data.value = await commercialAdmin.overview();
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
const metricCards = computed(() => [
  ["Total users", metrics.value.totalUsers],
  ["Free users", metrics.value.freeUsers],
  ["Paid Pro", metrics.value.paidProUsers],
  ["Early Access", metrics.value.earlyAccessUsers],
  ["Standard trials", metrics.value.standardTrialUsers],
  ["Canceled", metrics.value.canceledSubscriptions],
  ["Verification failures", metrics.value.providerVerificationFailures],
  ["Failed billing events", metrics.value.failedBillingEvents],
]);
</script>
<template>
  <div class="page">
    <div class="page-intro">
      <div>
        <h2>Operational overview</h2>
        <p>
          Commercial readiness, lifecycle state, and platform health from
          protected server aggregates.
        </p>
      </div>
      <button
        class="button secondary"
        type="button"
        :disabled="loading"
        @click="load"
      >
        Refresh overview
      </button>
    </div>
    <AppDataState :loading="loading" :error="error" @retry="load"
      ><div class="metric-grid">
        <AppCard
          v-for="[label, value] in metricCards"
          :key="label"
          class="metric-card"
          ><span>{{ label }}</span
          ><strong>{{ value ?? 0 }}</strong></AppCard
        >
      </div>
      <div class="split-grid">
        <AppCard
          title="Monetization lifecycle"
          description="Open Early Access has no countdown or payment requirement."
          ><div class="timeline">
            <div class="timeline-item">
              <AppStatusBadge status="open_early_access" />
              <p>Eligible users receive Pro without expiry.</p>
            </div>
            <div class="timeline-item">
              <AppStatusBadge status="timed_early_access" />
              <p>
                {{ data?.monetization?.timed_started_at || "Not started" }} →
                {{ data?.monetization?.timed_ends_at || "Not scheduled" }}
              </p>
            </div>
            <div class="timeline-item">
              <AppStatusBadge status="paid_live" />
              <p>Paid catalog becomes the standard entitlement path.</p>
            </div>
          </div>
          <p>
            Current mode:
            <AppStatusBadge
              :status="data?.monetization?.mode || 'unknown'"
            /></p></AppCard
        ><AppCard title="Billing readiness"
          ><div
            v-for="provider in data?.provider || []"
            :key="provider.provider"
            class="record-row"
          >
            <div>
              <strong>{{ provider.provider }}</strong
              ><span class="technical-id">{{ provider.package_name }}</span>
            </div>
            <AppStatusBadge :status="provider.status" />
          </div>
          <p v-if="!(data?.provider || []).length">
            No provider configuration returned.
          </p></AppCard
        ><AppCard title="Application operations"
          ><div class="summary-list">
            <span
              >Maintenance<AppStatusBadge
                :status="
                  data?.operations?.maintenanceEnabled ? 'active' : 'inactive'
                " /></span
            ><span
              >Active announcements<strong>{{
                data?.operations?.activeAnnouncements ?? 0
              }}</strong></span
            ><span
              >Version policy<strong>{{
                data?.operations?.versionPolicyStatus || "Unknown"
              }}</strong></span
            >
          </div></AppCard
        ><AppCard title="Catalog and notifications"
          ><div class="summary-list">
            <span
              >Active products<strong>{{
                data?.catalog?.activeProducts ?? "—"
              }}</strong></span
            ><span
              >Research failed<strong>{{
                data?.catalog?.failed ?? "—"
              }}</strong></span
            ><span
              >Notification outbox failed<strong>{{
                data?.notifications?.failed ?? "—"
              }}</strong></span
            ><span
              >Enabled push devices<strong>{{
                data?.notifications?.enabledDevices ?? "—"
              }}</strong></span
            >
          </div></AppCard
        >
      </div>
      <AppCard
        title="Recent admin activity"
        description="Sanitized before/after details are available in Governance → Audit Log."
        ><div
          v-for="event in data?.recentAudit || []"
          :key="event.id"
          class="record-row"
        >
          <div>
            <strong>{{ event.action }}</strong
            ><span>{{ event.reason || "No reason recorded" }}</span>
          </div>
          <time>{{ new Date(event.created_at).toLocaleString() }}</time>
        </div>
        <p v-if="!(data?.recentAudit || []).length">
          No recent events returned.
        </p></AppCard
      ></AppDataState
    >
  </div>
</template>
<style scoped>
.record-row,
.summary-list span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--bs-border);
}
.record-row:last-child,
.summary-list span:last-child {
  border-bottom: 0;
}
.record-row div {
  display: grid;
}
.record-row span,
.record-row time {
  color: var(--bs-text-muted);
  font-size: 12px;
}
.summary-list {
  display: grid;
}
.summary-list strong {
  color: var(--bs-text);
}
</style>
