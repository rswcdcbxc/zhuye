import { defineStore } from "pinia";
import defaultSocialLinks from "@/assets/socialLinks.json";
import defaultSiteLinks from "@/assets/siteLinks.json";

// ── SHA-256 哈希（Web Crypto API） ──
const sha256 = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// 默认密码 "admin" 的哈希（首次访问时自动设置）
const DEFAULT_PASSWORD_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

export const configStore = defineStore("config", {
  state: () => ({
    // 社交链接
    socialLinks: [...defaultSocialLinks],
    // 网站链接
    siteLinks: [...defaultSiteLinks],
    // 站点信息
    siteInfo: {
      name: import.meta.env.VITE_SITE_NAME || "無名の主页",
      author: import.meta.env.VITE_SITE_AUTHOR || "無名",
      des: import.meta.env.VITE_SITE_DES || "一个默默无闻的主页",
      url: import.meta.env.VITE_SITE_URL || "imsyy.top",
      start: import.meta.env.VITE_SITE_START || "2020-10-24",
      icp: import.meta.env.VITE_SITE_ICP || "",
      hello: import.meta.env.VITE_DESC_HELLO || "Hello World !",
      descText: import.meta.env.VITE_DESC_TEXT || "一个建立于 21 世纪的小站，存活于互联网的边缘",
      helloOther: import.meta.env.VITE_DESC_HELLO_OTHER || "Oops !",
      descTextOther:
        import.meta.env.VITE_DESC_TEXT_OTHER ||
        "哎呀，这都被你发现了（ 再点击一次可关闭 ）",
    },
    // 管理面板开关
    adminOpen: false,
    // 管理面板密码（SHA-256 哈希）
    adminPassword: DEFAULT_PASSWORD_HASH,
    // 本次会话是否已认证
    adminAuthenticated: false,
  }),

  getters: {
    getSocialLinks(state) {
      return state.socialLinks;
    },
    getSiteLinks(state) {
      return state.siteLinks;
    },
    getSiteInfo(state) {
      return state.siteInfo;
    },
  },

  actions: {
    // 更新社交链接
    setSocialLinks(links) {
      this.socialLinks = links;
    },
    // 更新网站链接
    setSiteLinks(links) {
      this.siteLinks = links;
    },
    // 更新站点信息
    setSiteInfo(info) {
      this.siteInfo = { ...this.siteInfo, ...info };
    },
    // 切换管理面板
    toggleAdmin() {
      if (this.adminOpen) {
        // 关闭面板时清除认证状态
        this.adminOpen = false;
        this.adminAuthenticated = false;
      } else {
        this.adminOpen = true;
      }
    },
    // 校验密码
    async verifyPassword(input) {
      const hash = await sha256(input);
      return this.adminPassword === hash;
    },
    // 修改密码
    async changePassword(newPassword) {
      this.adminPassword = await sha256(newPassword);
    },
    // 设置认证状态
    setAuthenticated(val) {
      this.adminAuthenticated = val;
    },
    // 重置为默认
    resetToDefaults() {
      this.socialLinks = [...defaultSocialLinks];
      this.siteLinks = [...defaultSiteLinks];
      this.siteInfo = {
        name: import.meta.env.VITE_SITE_NAME || "無名の主页",
        author: import.meta.env.VITE_SITE_AUTHOR || "無名",
        des: import.meta.env.VITE_SITE_DES || "一个默默无闻的主页",
        url: import.meta.env.VITE_SITE_URL || "imsyy.top",
        start: import.meta.env.VITE_SITE_START || "2020-10-24",
        icp: import.meta.env.VITE_SITE_ICP || "",
        hello: import.meta.env.VITE_DESC_HELLO || "Hello World !",
        descText:
          import.meta.env.VITE_DESC_TEXT || "一个建立于 21 世纪的小站，存活于互联网的边缘",
        helloOther: import.meta.env.VITE_DESC_HELLO_OTHER || "Oops !",
        descTextOther:
          import.meta.env.VITE_DESC_TEXT_OTHER ||
          "哎呀，这都被你发现了（ 再点击一次可关闭 ）",
      };
    },
    // 导出 JSON 配置（下载文件）
    exportJSON() {
      const data = {
        socialLinks: this.socialLinks,
        siteLinks: this.siteLinks,
        siteInfo: this.siteInfo,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "home-config.json";
      a.click();
      URL.revokeObjectURL(url);
      ElMessage.success("配置文件已下载");
    },
    // 导入 JSON 配置
    importJSON(json) {
      try {
        const data = typeof json === "string" ? JSON.parse(json) : json;
        if (data.socialLinks) this.socialLinks = data.socialLinks;
        if (data.siteLinks) this.siteLinks = data.siteLinks;
        if (data.siteInfo) this.siteInfo = { ...this.siteInfo, ...data.siteInfo };
        ElMessage.success("配置已导入");
      } catch (e) {
        ElMessage.error("JSON 格式错误");
      }
    },
  },

  persist: {
    key: "home-config",
    storage: window.localStorage,
    paths: ["socialLinks", "siteLinks", "siteInfo", "adminPassword"],
  },
});
