<script setup>
import { onMounted, reactive, ref } from "vue";
import { commercialAdmin } from "../../api/commercialAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import AppCard from "../../components/ui/AppCard.vue";
import AppDataState from "../../components/ui/AppDataState.vue";
import AppDrawer from "../../components/ui/AppDrawer.vue";
import JsonViewer from "../../components/ui/JsonViewer.vue";

const filters = reactive({
  from: "",
  to: "",
  action: "",
  targetType: "",
  targetId: "",
  actorId: "",
  reason: "",
  page: 0,
  pageSize: 50,
});
const events = ref([]);
const count = ref(0);
const loading = ref(true);
const error = ref(null);
const selected = ref(null);
async function load() {
  loading.value = true;
  error.value = null;
  try {
    const result = await commercialAdmin.auditLog(filters);
    events.value = result.events || [];
    count.value = result.count || 0;
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    loading.value = false;
  }
}
function exportCsv() {
  const columns = [
    "created_at",
    "actor_user_id",
    "action",
    "target_type",
    "target_id",
    "reason",
    "correlation_id",
  ];
  const cell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.join(","),
    ...events.value.map((row) =>
      columns.map((key) => cell(row[key])).join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "finance-suit-audit.csv";
  link.click();
  URL.revokeObjectURL(url);
}
onMounted(load);
</script>
<template>
  <div class="page">
    <div class="page-intro">
      <div>
        <h2>Audit log</h2>
        <p>
          Privileged actions, actors, reasons, targets, and sanitized state
          changes.
        </p>
      </div>
      <button
        class="button secondary"
        type="button"
        :disabled="!events.length"
        @click="exportCsv"
      >
        Export filtered CSV
      </button>
    </div>
    <AppCard
      ><form
        class="filter-bar"
        @submit.prevent="
          filters.page = 0;
          load();
        "
      >
        <label class="field"
          ><span>From</span><input v-model="filters.from" type="date" /></label
        ><label class="field"
          ><span>To</span><input v-model="filters.to" type="date" /></label
        ><label class="field"
          ><span>Action</span><input v-model.trim="filters.action" /></label
        ><label class="field"
          ><span>Target type</span
          ><input v-model.trim="filters.targetType" /></label
        ><label class="field"
          ><span>Target ID</span
          ><input v-model.trim="filters.targetId" class="technical-id" /></label
        ><label class="field"
          ><span>Actor ID</span
          ><input v-model.trim="filters.actorId" class="technical-id" /></label
        ><label class="field"
          ><span>Reason contains</span
          ><input v-model.trim="filters.reason" /></label
        ><button class="button primary" type="submit">Filter</button>
      </form>
      <AppDataState
        :loading="loading"
        :error="error"
        :empty="!events.length"
        @retry="load"
        ><div class="table-wrap">
          <table>
            <caption>
              {{
                count
              }}
              audit events
            </caption>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in events" :key="event.id">
                <td>{{ new Date(event.created_at).toLocaleString() }}</td>
                <td class="technical-id">{{ event.actor_user_id }}</td>
                <td>{{ event.action }}</td>
                <td>
                  {{ event.target_type }}<br /><span class="technical-id">{{
                    event.target_id
                  }}</span>
                </td>
                <td>{{ event.reason || "No reason recorded" }}</td>
                <td>
                  <button
                    class="button secondary"
                    type="button"
                    @click="selected = event"
                  >
                    Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>Showing {{ events.length }} of {{ count }}</span>
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
              :disabled="(filters.page + 1) * filters.pageSize >= count"
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
      title="Audit event"
      :description="
        selected?.correlation_id
          ? `Correlation ${selected.correlation_id}`
          : 'No correlation ID recorded'
      "
      @close="selected = null"
      ><h3>Before state</h3>
      <JsonViewer :value="selected?.before_state" />
      <h3>After state</h3>
      <JsonViewer :value="selected?.after_state"
    /></AppDrawer>
  </div>
</template>
