<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { commercialAdmin } from "../../api/commercialAdmin";
import { operationsAdmin } from "../../api/operationsAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import { useToast } from "../../app/composables/useToast";
import AppCard from "../../components/ui/AppCard.vue";
import AppDataState from "../../components/ui/AppDataState.vue";
import AppModal from "../../components/ui/AppModal.vue";
import AppStatusBadge from "../../components/ui/AppStatusBadge.vue";
import JsonViewer from "../../components/ui/JsonViewer.vue";
import ReasonConfirmationDialog from "../../components/ui/ReasonConfirmationDialog.vue";

const props = defineProps({ section: String });
const data = ref(null);
const health = ref(null);
const loading = ref(true);
const error = ref(null);
const mutating = ref(false);
const { push } = useToast();
const editor = reactive({
  open: false,
  type: "",
  id: "",
  key: "",
  value: "",
  reason: "",
});
const confirmation = reactive({
  open: false,
  title: "",
  consequence: "",
  label: "Confirm",
  destructive: false,
  run: null,
});
const adminForm = reactive({
  userId: "",
  role: "super_admin",
  status: "active",
  reason: "",
});
const title = computed(
  () =>
    ({
      config: "App configuration",
      announcements: "Announcements",
      notifications: "Notification health",
      admins: "Platform administrators",
    })[props.section],
);
async function load() {
  loading.value = true;
  error.value = null;
  try {
    if (props.section === "notifications") {
      health.value = await operationsAdmin.health();
      data.value = null;
    } else {
      data.value = await commercialAdmin.operations();
      health.value = null;
    }
  } catch (value) {
    error.value = normalizeAdminError(value);
  } finally {
    loading.value = false;
  }
}
function editConfig(item) {
  Object.assign(editor, {
    open: true,
    type: "config",
    id: "",
    key: item.key,
    value: JSON.stringify(item.value, null, 2),
    reason: "",
  });
}
function editAnnouncement(item = null) {
  Object.assign(editor, {
    open: true,
    type: "announcement",
    id: item?.id || "",
    key: item?.title || "",
    value: JSON.stringify(
      item || {
        title: "",
        body: "",
        severity: "info",
        audience: "all",
        active: false,
        starts_at: null,
        ends_at: null,
        dismissible: true,
      },
      null,
      2,
    ),
    reason: "",
  });
}
async function saveEditor() {
  if (editor.reason.trim().length < 6) return;
  let parsed;
  try {
    parsed = JSON.parse(editor.value);
  } catch {
    push("JSON is invalid.", "error");
    return;
  }
  mutating.value = true;
  try {
    if (editor.type === "config")
      await commercialAdmin.updateConfig({
        configKey: editor.key,
        value: parsed,
        reason: editor.reason.trim(),
      });
    else
      await commercialAdmin.saveAnnouncement({
        announcementId: editor.id || undefined,
        announcement: parsed,
        reason: editor.reason.trim(),
      });
    editor.open = false;
    push("Operation saved and audited.", "success");
    await load();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
function ask(titleValue, consequence, label, run, destructive = false) {
  Object.assign(confirmation, {
    open: true,
    title: titleValue,
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
    push("Operation completed.", "success");
    await load();
  } catch (value) {
    push(normalizeAdminError(value).message, "error");
  } finally {
    mutating.value = false;
  }
}
async function saveAdmin() {
  if (adminForm.reason.trim().length < 6) return;
  mutating.value = true;
  try {
    await commercialAdmin.updatePlatformAdmin(adminForm);
    Object.assign(adminForm, {
      userId: "",
      role: "super_admin",
      status: "active",
      reason: "",
    });
    push("Platform administrator updated.", "success");
    await load();
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
        <h2>{{ title }}</h2>
        <p>
          Protected platform operations with narrow server authority and
          sanitized output.
        </p>
      </div>
      <button class="button secondary" type="button" @click="load">
        Refresh
      </button>
    </div>
    <nav class="tabs-inline" aria-label="Operations sections">
      <RouterLink to="/operations/config">App Configuration</RouterLink
      ><RouterLink to="/operations/announcements">Announcements</RouterLink
      ><RouterLink to="/operations/notifications"
        >Notification Health</RouterLink
      ><RouterLink to="/operations/admins">Platform Admins</RouterLink>
    </nav>
    <AppDataState :loading="loading" :error="error" @retry="load"
      ><template v-if="section === 'config'"
        ><AppCard
          title="Published configuration"
          description="Known groups are summarized; Advanced JSON is validated server-side before save."
          ><div
            v-for="item in data?.config || []"
            :key="item.key"
            class="record-row"
          >
            <div>
              <strong>{{ item.key }}</strong
              ><JsonViewer :value="item.value" />
            </div>
            <button
              class="button secondary"
              type="button"
              @click="editConfig(item)"
            >
              Edit
            </button>
          </div></AppCard
        ></template
      ><template v-else-if="section === 'announcements'"
        ><AppCard
          title="Announcements"
          description="Severity is semantic status, never decorative branding."
          ><template #actions
            ><button
              class="button primary"
              type="button"
              @click="editAnnouncement()"
            >
              Create announcement
            </button></template
          >
          <div
            v-for="item in data?.announcements || []"
            :key="item.id"
            class="record-row"
          >
            <div>
              <strong>{{ item.title }}</strong
              ><span
                >{{ item.audience }} ·
                {{
                  item.starts_at
                    ? new Date(item.starts_at).toLocaleString()
                    : "Immediate"
                }}
                →
                {{
                  item.ends_at
                    ? new Date(item.ends_at).toLocaleString()
                    : "No end"
                }}</span
              >
              <p>{{ item.body }}</p>
            </div>
            <AppStatusBadge
              :status="item.active ? item.severity : 'inactive'"
            /><button
              class="button secondary"
              type="button"
              @click="editAnnouncement(item)"
            >
              Edit
            </button>
          </div>
          <p v-if="!(data?.announcements || []).length">
            No announcements.
          </p></AppCard
        ></template
      ><template v-else-if="section === 'notifications'"
        ><div class="metric-grid">
          <AppCard
            v-for="item in [
              ['Pending', health?.outbox?.pending],
              ['Sending / leased', health?.outbox?.sending],
              ['Failed', health?.outbox?.failed],
              ['Sent recently', health?.outbox?.sent],
              ['Enabled devices', health?.devices?.enabled],
              ['Disabled devices', health?.devices?.disabled],
              ['Recent logical', health?.logicalRecent],
              [
                'Worker activity',
                health?.lastActivity
                  ? new Date(health.lastActivity).toLocaleString()
                  : '—',
              ],
            ]"
            :key="item[0]"
            class="metric-card"
            ><span>{{ item[0] }}</span
            ><strong>{{ item[1] ?? "—" }}</strong></AppCard
          >
        </div>
        <div class="split-grid">
          <AppCard title="Notification event catalog"
            ><div
              v-for="item in health?.eventCatalog || []"
              :key="item.event_key"
              class="record-row"
            >
              <div>
                <strong>{{ item.event_key }}</strong
                ><span>{{ item.category }}</span>
              </div>
              <AppStatusBadge
                :status="item.active ? 'active' : 'inactive'"
              /></div></AppCard
          ><AppCard title="Safe test operation"
            ><p>
              Sends the existing developer-test event to your own authenticated
              account through the canonical notification path.
            </p>
            <button
              class="button primary"
              type="button"
              @click="
                ask(
                  'Send test notification to me',
                  'No arbitrary token or private payload is accepted. The event is queued through the approved RPC.',
                  'Send test',
                  (reason) => operationsAdmin.sendTestNotification(reason),
                )
              "
            >
              Send test to me
            </button>
            <p class="notice">
              Raw FCM tokens, financial message content, and credentials are
              never returned.
            </p></AppCard
          >
        </div></template
      ><template v-else
        ><div class="split-grid">
          <AppCard title="Active administrator records"
            ><div
              v-for="item in data?.admins || []"
              :key="item.user_id"
              class="record-row"
            >
              <div>
                <strong class="technical-id">{{ item.user_id }}</strong
                ><span
                  >{{ item.role }} · created
                  {{ new Date(item.created_at).toLocaleString() }}</span
                >
              </div>
              <AppStatusBadge :status="item.status" /></div></AppCard
          ><AppCard
            title="Add or update administrator"
            description="Exact auth user UUID only. Other role permissions remain undefined and are not activated by this UI."
            ><div class="form-grid">
              <label class="field full"
                ><span>User UUID</span
                ><input
                  v-model.trim="adminForm.userId"
                  class="technical-id" /></label
              ><label class="field"
                ><span>Role</span
                ><select v-model="adminForm.role">
                  <option value="super_admin">Super Admin</option>
                  <option disabled value="billing_admin">
                    Billing Admin (undefined)
                  </option>
                  <option disabled value="support_admin">
                    Support Admin (undefined)
                  </option>
                  <option disabled value="read_only_admin">
                    Read-only Admin (undefined)
                  </option>
                </select></label
              ><label class="field"
                ><span>Status</span
                ><select v-model="adminForm.status">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="revoked">Revoked</option>
                </select></label
              ><label class="field full"
                ><span>Reason</span
                ><textarea
                  v-model="adminForm.reason"
                  rows="3"
                  minlength="6"
                  maxlength="1000"
                />
              </label>
            </div>
            <button
              class="button primary"
              type="button"
              :disabled="mutating || adminForm.reason.trim().length < 6"
              @click="saveAdmin"
            >
              Review and apply
            </button>
            <p class="notice warning">
              The server transaction prevents self-revocation and removal of the
              last active Super Admin.
            </p></AppCard
          >
        </div></template
      ></AppDataState
    ><AppModal
      :open="editor.open"
      :title="
        editor.type === 'config' ? `Edit ${editor.key}` : 'Announcement editor'
      "
      description="Advanced JSON is parsed in the browser and strictly validated again by the server."
      @close="editor.open = false"
      ><label class="field"
        ><span>JSON document</span
        ><textarea
          v-model="editor.value"
          class="technical-id"
          rows="16"
          spellcheck="false"
        /></label
      ><label class="field"
        ><span>Administrative reason</span
        ><textarea
          v-model="editor.reason"
          rows="3"
          minlength="6"
          maxlength="1000"
        />
      </label>
      <footer class="modal-actions">
        <button
          class="button secondary"
          type="button"
          @click="editor.open = false"
        >
          Cancel</button
        ><button
          class="button primary"
          type="button"
          :disabled="mutating || editor.reason.trim().length < 6"
          @click="saveEditor"
        >
          Save
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
.record-row {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 14px 0;
  border-block-end: 1px solid var(--bs-border);
}
.record-row > div {
  display: grid;
  gap: 3px;
  min-width: 0;
  margin-inline-end: auto;
}
.record-row span {
  color: var(--bs-text-muted);
  font-size: 12px;
}
.record-row p {
  margin: 3px 0;
}
.record-row .json-viewer {
  max-height: 180px;
}
@media (max-width: 620px) {
  .record-row {
    align-items: stretch;
    flex-direction: column;
  }
  .record-row > div {
    margin: 0;
  }
}
</style>
