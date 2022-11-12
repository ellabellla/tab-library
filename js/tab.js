const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
let activeWindowId = parseInt(params.id);

const save = document.getElementById("save");
save.addEventListener("click", async () => {
    const fh = await createFile();
    const file = await fh.getFile();
    const name = file.name.replace(/\.[^\.]+$/g, "");
    const writable = await fh.createWritable();

    const topLevelTabs = await chrome.tabs.query({
        groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
        windowId: activeWindowId,
    });
    const groupInfo = await chrome.tabGroups.query({
        windowId: activeWindowId,
    });

    let groups = [];
    for (group of groupInfo) {
        groups.push({
            "id": group["id"],
            "title": group["title"],
            "color": group["color"],
            "tabs": await chrome.tabs.query({
                groupId: group.id,
                windowId: activeWindowId,
            })
        })
    }

    await writable.write(`# ${name}\n`);
    for (tab of topLevelTabs) {
        await writable.write(` - ${tab["title"]}\n`);
        await writable.write(`   - ${tab["url"] === "" ? tab["pendingUrl"] : tab["url"]}\n`);
    }

    for (group of groups) {
        await writable.write(`## ${group["title"]} ![](https://placehold.co/15x15/${group["color"]}/${group["color"]}.png)\n`);
        for (tab of group["tabs"]) {
            await writable.write(` - ${tab["title"]}\n`);
            await writable.write(`   - ${tab["url"] === "" ? tab["pendingUrl"] : tab["url"]}\n`);
        }
    }

    await writable.close();
});


const load = document.getElementById("load");
load.addEventListener("click", async () => {
    let md = await readFile();
    let lines = md.split("\n");

    let topLevelTabs = [];
    let groups = [];
    let allTabs = [];

    let active = null;

    let i = 0;
    for (i; i < lines.length; i++) {
        if (lines[i].substr(0, 2) === "# ") {
            break;
        }
    }
    for (i; i < lines.length; i++) {
        if (i < lines.length-1 && lines[i].substr(0, 3) === " - ") {
            topLevelTabs.push(lines[i+1].substr("   - ".length));
            i++;
        } else if (lines[i].substr(0,3) === "## ") {
            break;
        }
    }
    while (i < lines.length && lines[i].substr(0,3) === "## ") {
        let match = lines[i].matchAll(/## (.*?)!\[\]\(https:\/\/placehold\.co\/15x15\/(.+?)\/.*?\.png\)/g).next().value;
        i++;
        let tabs = [];
        for (i; i < lines.length; i++) {
            if (i < lines.length-1 && lines[i].substr(0, 3) === " - ") {
                tabs.push(lines[i+1].substr("   - ".length));
                i++;
            } else if (lines[i].substr(0,3) === "## ") {
                break;
            }
        }
        groups.push(group = {
            "title": match[1],
            "color": match[2],
            "tabs": tabs,
        });
    }

    async function discardTab(tabId, changeInfo, tab) {
        if (tabId in allTabs) {
            if(changeInfo.url) {
                await chrome.tabs.discard(tabId);
                delete allTabs[tabId];
            }
        }
    }

    await chrome.tabs.onUpdated.addListener(discardTab);
    
    let windowCreated = false;
    let windowId = 0;

    if (topLevelTabs.length != 0) {
        let library = await chrome.windows.create({
            focused: false,
            state: "minimized",
            url: topLevelTabs,
        });
        active = library["tabs"][0]["id"];
        for (tab of library["tabs"]) {
            allTabs[tab["id"]] = true;
        }
        windowCreated = true;
        windowId = library["id"];
    }

    for (let group of groups) {
        let tabs = [];
        if (group["tabs"].length != 0) {
            if (!windowCreated) {
                let library = await chrome.windows.create({
                    url: group["tabs"], 
                    windowId: windowId, 
                    state: "minimized",
                    focused: false,
                });
                tabs = library["tabs"].map(tab => tab["id"]);
                active = tabs[0];
                for (tab of library["tabs"]) {
                    allTabs[tab["id"]] = true;
                }
                windowCreated = true;
                windowId = library["id"];
            } else {
                for (tab of group["tabs"]) {
                    let createdTab = await chrome.tabs.create({
                        url: tab,
                        windowId: windowId,
                        active: false,
                    });
                    tabs.push(createdTab["id"]);
                }
            }
        }

        let groupId = await chrome.tabs.group({
            createProperties:{
                windowId: windowId,
            },
            tabIds: tabs,
        });

        for (tab of tabs) {
            allTabs[tab] = true;
        }

        await chrome.tabGroups.update(
            groupId,
            {
                color: group["color"],
                title: group["title"],
                collapsed: true,
            }
        );
    }

    await chrome.tabs.onUpdated.removeListener(discardTab);

    await chrome.tabs.update(
        active,
        {
            active: true,
        }
    );
    await chrome.tabs.reload(active);
    await chrome.windows.update(
        windowId,
        {
            focused: true,
        }
    );

});

const FILE_OPTIONS = {
    types: [
        {
            description: 'Markdown files',
            accept: {
            'text/plain': ['.md'],
            },
        },
    ],
    multiple: false,
};

async function createFile() {
    return await window.showSaveFilePicker(FILE_OPTIONS);
}

async function readFile() {
    const [fh] = await window.showOpenFilePicker(FILE_OPTIONS);
    const file = await fh.getFile();
    return await file.text();
}