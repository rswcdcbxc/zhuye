<template>
  <Transition name="admin-fade">
    <div v-if="store.adminOpen" class="admin-overlay" @click.self="onOverlayClick">
      <!-- ─── 密码认证界面 ─── -->
      <div v-if="!store.adminAuthenticated" class="auth-card">
        <div class="auth-icon">🔐</div>
        <h3>身份验证</h3>
        <p class="auth-sub">请输入管理密码以继续</p>
        <form @submit.prevent="doLogin" class="auth-form">
          <input
            ref="pwdInput"
            v-model="loginPwd"
            type="password"
            placeholder="输入密码"
            class="auth-input"
            autofocus
          />
          <button type="submit" class="auth-btn" :disabled="loginLoading">
            {{ loginLoading ? "验证中..." : "确 认" }}
          </button>
        </form>
        <p v-if="loginError" class="auth-error">{{ loginError }}</p>
      </div>

      <!-- ─── 管理面板 ─── -->
      <div v-else class="admin-panel">
        <!-- 头部 -->
        <div class="admin-header">
          <h2>⚙ 管理面板</h2>
          <button class="btn-close" @click="store.toggleAdmin()">✕</button>
        </div>

        <!-- 标签切换 -->
        <div class="admin-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 社交链接编辑 -->
        <div v-if="activeTab === 'social'" class="admin-body">
          <div class="toolbar">
            <button class="btn-add" @click="addSocial">+ 添加链接</button>
            <span class="hint">拖拽 ● 可排序</span>
          </div>
          <div class="edit-list">
            <div
              v-for="(item, index) in editingSocial"
              :key="index"
              class="edit-item"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover.prevent
              @drop="onDrop($event, index)"
            >
              <span class="drag-handle">●</span>
              <input v-model="item.name" placeholder="名称" class="input-sm" />
              <input v-model="item.icon" placeholder="图标路径" class="input-sm" />
              <input v-model="item.tip" placeholder="提示文字" class="input-md" />
              <input v-model="item.url" placeholder="链接 URL" class="input-lg" />
              <button class="btn-del" @click="removeSocial(index)">✕</button>
            </div>
          </div>
        </div>

        <!-- 网站链接编辑 -->
        <div v-if="activeTab === 'site'" class="admin-body">
          <div class="toolbar">
            <button class="btn-add" @click="addSite">+ 添加链接</button>
            <span class="hint">图标名参考 <a href="https://www.xicons.org" target="_blank">xicons.org</a></span>
          </div>
          <div class="edit-list">
            <div v-for="(item, index) in editingSite" :key="index" class="edit-item">
              <select v-model="item.icon" class="input-sm">
                <option v-for="ic in iconOptions" :key="ic" :value="ic">{{ ic }}</option>
              </select>
              <input v-model="item.name" placeholder="名称" class="input-sm" />
              <input v-model="item.link" placeholder="链接 URL" class="input-lg" />
              <button class="btn-del" @click="removeSite(index)">✕</button>
            </div>
          </div>
        </div>

        <!-- 站点信息编辑 -->
        <div v-if="activeTab === 'info'" class="admin-body">
          <div class="info-form">
            <label>站点名称 <input v-model="editingInfo.name" /></label>
            <label>作者 <input v-model="editingInfo.author" /></label>
            <label>站点描述 <input v-model="editingInfo.des" /></label>
            <label>站点地址 <input v-model="editingInfo.url" /></label>
            <label>建站日期 <input v-model="editingInfo.start" placeholder="YYYY-MM-DD" /></label>
            <label>ICP 备案号 <input v-model="editingInfo.icp" /></label>
            <label>欢迎语 <input v-model="editingInfo.hello" /></label>
            <label>简介文字 <input v-model="editingInfo.descText" /></label>
            <label>备选欢迎语 <input v-model="editingInfo.helloOther" /></label>
            <label>备选简介 <input v-model="editingInfo.descTextOther" /></label>
          </div>
        </div>

        <!-- 修改密码 -->
        <div v-if="activeTab === 'password'" class="admin-body">
          <div class="pwd-section">
            <h4>修改管理密码</h4>
            <form @submit.prevent="doChangePwd" class="pwd-form">
              <input v-model="newPwd" type="password" placeholder="新密码" class="pwd-input" />
              <input v-model="newPwd2" type="password" placeholder="确认新密码" class="pwd-input" />
              <button type="submit" class="auth-btn" :disabled="pwdLoading">
                {{ pwdLoading ? "修改中..." : "修改密码" }}
              </button>
            </form>
            <p v-if="pwdMsg" :class="pwdOk ? 'pwd-ok' : 'pwd-error'">{{ pwdMsg }}</p>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="admin-footer">
          <button class="btn-save" @click="saveAll">💾 保存</button>
          <button class="btn-export" @click="store.exportJSON()">📥 导出 JSON</button>
          <label class="btn-import">
            📤 导入 JSON
            <input type="file" accept=".json" hidden @change="onImportJSON" />
          </label>
          <button class="btn-reset" @click="resetAll">🔄 恢复默认</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { configStore } from "@/stores/config";
import { nextTick } from "vue";

const store = configStore();

// ── 标签 ──
const tabs = [
  { id: "social", label: "🔗 社交链接" },
  { id: "site", label: "🌐 网站链接" },
  { id: "info", label: "📝 站点信息" },
  { id: "password", label: "🔑 修改密码" },
];
const activeTab = ref("social");

// ── 登录 ──
const pwdInput = ref(null);
const loginPwd = ref("");
const loginLoading = ref(false);
const loginError = ref("");

const doLogin = async () => {
  loginError.value = "";
  if (!loginPwd.value) {
    loginError.value = "请输入密码";
    return;
  }
  loginLoading.value = true;
  const ok = await store.verifyPassword(loginPwd.value);
  if (ok) {
    store.setAuthenticated(true);
    loginPwd.value = "";
    loginLoading.value = false;
    loadEdits();
  } else {
    loginError.value = "密码错误";
    loginPwd.value = "";
    loginLoading.value = false;
    nextTick(() => pwdInput.value?.focus());
  }
};

// ── 修改密码 ──
const newPwd = ref("");
const newPwd2 = ref("");
const pwdLoading = ref(false);
const pwdMsg = ref("");
const pwdOk = ref(false);

const doChangePwd = async () => {
  pwdMsg.value = "";
  if (!newPwd.value || newPwd.value.length < 3) {
    pwdMsg.value = "密码至少 3 位";
    pwdOk.value = false;
    return;
  }
  if (newPwd.value !== newPwd2.value) {
    pwdMsg.value = "两次密码不一致";
    pwdOk.value = false;
    return;
  }
  pwdLoading.value = true;
  await store.changePassword(newPwd.value);
  pwdLoading.value = false;
  pwdMsg.value = "密码修改成功 ✓";
  pwdOk.value = true;
  newPwd.value = "";
  newPwd2.value = "";
};

// ── 图标选项 ──
const iconOptions = [
  "Blog", "Cloud", "CompactDisc", "Compass", "Book", "Fire", "LaptopCode",
  "Link", "Home", "Search", "Star", "Heart", "User", "Setting", "Mail",
  "Music", "Video", "Image", "File", "Folder", "Calendar", "Clock",
  "Globe", "Map", "Pin", "Phone", "Message", "Chat", "Bell", "Lock",
  "Key", "Tool", "Edit", "Delete", "Add", "Minus", "Check", "Close",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Upload", "Download",
  "Play", "Pause", "Stop", "Forward", "Backward", "Refresh", "Sync",
];

// ── 编辑副本 ──
const editingSocial = ref([]);
const editingSite = ref([]);
const editingInfo = ref({});

const loadEdits = () => {
  editingSocial.value = JSON.parse(JSON.stringify(store.socialLinks));
  editingSite.value = JSON.parse(JSON.stringify(store.siteLinks));
  editingInfo.value = { ...store.siteInfo };
};

// ── 拖拽排序 ──
let dragIndex = null;
const onDragStart = (e, index) => {
  dragIndex = index;
  e.dataTransfer.effectAllowed = "move";
};
const onDrop = (e, index) => {
  if (dragIndex === null || dragIndex === index) return;
  const list = [...editingSocial.value];
  const [item] = list.splice(dragIndex, 1);
  list.splice(index, 0, item);
  editingSocial.value = list;
  dragIndex = null;
};

// ── CRUD ──
const addSocial = () => editingSocial.value.push({ name: "", icon: "/images/icon/link.png", tip: "", url: "" });
const removeSocial = (i) => editingSocial.value.splice(i, 1);
const addSite = () => editingSite.value.push({ icon: "Link", name: "", link: "" });
const removeSite = (i) => editingSite.value.splice(i, 1);

const saveAll = () => {
  store.setSocialLinks(editingSocial.value);
  store.setSiteLinks(editingSite.value);
  store.setSiteInfo(editingInfo.value);
  ElMessage.success("配置已保存 ✨");
};

const resetAll = () => {
  store.resetToDefaults();
  loadEdits();
  ElMessage.success("已恢复默认配置");
};

const onImportJSON = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { store.importJSON(ev.target.result); loadEdits(); };
  reader.readAsText(file);
};

// ── 遮罩点击关面板 ──
const onOverlayClick = () => {
  if (store.adminAuthenticated) {
    // 已认证状态下点击遮罩才关闭
    store.toggleAdmin();
  }
};

// ── 面板打开时聚焦输入框 ──
watch(() => store.adminOpen, (val) => {
  if (val) {
    loginError.value = "";
    loginPwd.value = "";
    activeTab.value = "social";
    nextTick(() => pwdInput.value?.focus());
  }
});

// ── Escape 关闭 ──
const onKeydown = (e) => {
  if (e.key === "Escape") {
    store.toggleAdmin();
  }
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style lang="scss" scoped>
// ── 遮罩（毛玻璃） ──
.admin-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade 0.25s;
}

// ═══════════════════════════════════════
// 认证卡片（毛玻璃风格）
// ═══════════════════════════════════════
.auth-card {
  width: 360px;
  max-width: 90vw;
  padding: 40px 32px;
  border-radius: 20px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  text-align: center;
  animation: fade-up 0.3s ease;

  .auth-icon { font-size: 2.6rem; margin-bottom: 12px; }
  h3 { margin: 0 0 6px; font-size: 1.2rem; color: #fff; font-weight: 500; }
  .auth-sub { margin: 0 0 24px; font-size: 0.85rem; color: #fff6; }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .auth-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: #fff;
    font-size: 0.95rem;
    text-align: center;
    outline: none;
    transition: border 0.2s;
    box-sizing: border-box;
    &:focus { border-color: rgba(130, 170, 255, 0.5); }
  }

  .auth-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #5b8def, #3b6de6);
    color: #fff;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(59, 109, 230, 0.3); }
    &:disabled { opacity: 0.6; cursor: default; }
  }

  .auth-error { margin: 12px 0 0; font-size: 0.85rem; color: #f66; }
}

// ═══════════════════════════════════════
// 管理面板主体
// ═══════════════════════════════════════
.admin-panel {
  width: min(720px, 95vw);
  max-height: 85vh;
  background: rgba(18, 18, 28, 0.92);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  animation: fade-up 0.3s ease;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  h2 { margin: 0; font-size: 1.15rem; color: #fff; font-weight: 500; }
  .btn-close {
    background: none; border: none; color: #fff6; font-size: 1.2rem;
    cursor: pointer; padding: 4px 10px; border-radius: 8px; transition: all 0.2s;
    &:hover { background: rgba(255,255,255,0.08); color: #fff; }
  }
}

.admin-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
  button {
    flex-shrink: 0;
    background: none; border: none; color: #fff5; padding: 7px 14px;
    border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
    white-space: nowrap;
    &.active { background: rgba(255,255,255,0.1); color: #fff; }
    &:hover:not(.active) { background: rgba(255,255,255,0.04); color: #fffc; }
  }
}

// ── 内容区 ──
.admin-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    .hint { color: #fff4; font-size: 0.78rem; a { color: #7ab4ff; } }
  }
}

// 编辑列表
.edit-list { display: flex; flex-direction: column; gap: 8px; }
.edit-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.04);
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.06); }
  .drag-handle { cursor: grab; color: #fff3; user-select: none; margin-right: 2px; font-size: 0.7rem; }
  input, select {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 7px;
    padding: 7px 10px;
    color: #fff;
    font-size: 0.82rem;
    outline: none;
    transition: border 0.2s;
    &:focus { border-color: rgba(110, 160, 255, 0.45); }
  }
  .input-sm { width: 90px; }
  .input-md { width: 130px; }
  .input-lg { flex: 1; min-width: 120px; }
  .btn-del {
    background: none; border: none; color: #f558; cursor: pointer;
    padding: 4px 8px; border-radius: 6px; font-size: 0.85rem; transition: all 0.2s;
    &:hover { background: rgba(255,70,70,0.15); color: #f66; }
  }
  select { cursor: pointer; }
}

// 站点信息表单
.info-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
  label {
    color: #fffc;
    font-size: 0.82rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
    input {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      padding: 8px 12px;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
      transition: border 0.2s;
      &:focus { border-color: rgba(110, 160, 255, 0.45); }
    }
  }
}

// 修改密码
.pwd-section {
  max-width: 360px;
  margin: 0 auto;
  h4 { color: #fff; font-weight: 500; margin: 0 0 16px; text-align: center; }
  .pwd-form { display: flex; flex-direction: column; gap: 12px; }
  .pwd-input {
    padding: 12px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    text-align: center;
    outline: none;
    &:focus { border-color: rgba(110, 160, 255, 0.45); }
  }
  .auth-btn {
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #5b8def, #3b6de6);
    color: #fff;
    font-size: 0.95rem;
    cursor: pointer;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(59, 109, 230, 0.3); }
    &:disabled { opacity: 0.6; cursor: default; }
  }
  .pwd-ok { color: #4caf50; font-size: 0.85rem; text-align: center; margin: 8px 0 0; }
  .pwd-error { color: #f66; font-size: 0.85rem; text-align: center; margin: 8px 0 0; }
}

// ── 底部栏 ──
.admin-footer {
  display: flex;
  gap: 8px;
  padding: 14px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
  button, .btn-import {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.82rem;
    transition: all 0.2s;
  }
  .btn-save {
    background: linear-gradient(135deg, #5b8def, #3b6de6);
    color: #fff;
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59, 109, 230, 0.3); }
  }
  .btn-export { background: rgba(255,255,255,0.08); color: #fff; &:hover { background: rgba(255,255,255,0.14); } }
  .btn-import {
    background: rgba(255,255,255,0.08); color: #fff; display: inline-flex; align-items: center;
    &:hover { background: rgba(255,255,255,0.14); }
  }
  .btn-reset { background: rgba(255,80,80,0.12); color: #f88; &:hover { background: rgba(255,80,80,0.22); } }
}

// ── 通用添加按钮 ──
.btn-add {
  padding: 7px 16px;
  border: 1px dashed rgba(255,255,255,0.15);
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  color: #fff9;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.25); color: #fff; }
}

// ── 过渡动画 ──
.admin-fade-enter-active, .admin-fade-leave-active {
  transition: opacity 0.2s;
  .admin-panel, .auth-card { transition: transform 0.2s ease, opacity 0.2s; }
}
.admin-fade-enter-from, .admin-fade-leave-to {
  opacity: 0;
  .admin-panel, .auth-card { transform: scale(0.95) translateY(8px); opacity: 0; }
}

// ── 入场动画 ──
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
