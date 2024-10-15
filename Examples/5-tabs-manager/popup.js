const tabs = await chrome.tabs.query({
  url: [
    "https://developer.chrome.com/docs/webstore/*",
    "https://developer.chrome.com/docs/extensions/*",
    "https://*.wikipedia.org/*",
  ],
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

const template = document.getElementById("li_template");
const elements = new Set();
for (const tab of tabs) {
  const element = template.content.firstElementChild.cloneNode(true);

  const title = tab.title.split("|")[0].trim();
  const pathname = new URL(tab.url).pathname.slice("/docs".length);

  element.querySelector(".title").textContent = title;
  element.querySelector(".pathname").textContent = pathname;
  element.querySelector("a").addEventListener("click", async () => {
    // need to focus window as well as the active tab
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  });

  elements.add(element);
}
document.querySelector("ul").append(...elements);

const button = document.querySelector("button");
button.addEventListener("click", async () => {
  const chromeTabs = tabs.filter((tab) => tab.url.includes("chrome.com"));
  const wikipediaTabs = tabs.filter((tab) => tab.url.includes("wikipedia.org"));

  await groupTabs(chromeTabs, "Chrome Docs");
  await groupTabs(wikipediaTabs, "Wikipedia");
});

const groupTabs = async (tabs, title) => {
  if (tabs.length) {
    const tabIds = tabs.map(({ id }) => id);
    const groupId = await chrome.tabs.group({ tabIds: tabIds });
    await chrome.tabGroups.update(groupId, { title: title });
  }
};
