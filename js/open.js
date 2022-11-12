async function openDialog() {
    let active = await chrome.windows.getCurrent();
    chrome.windows.create({
        url:`dialog.html?id=${active["id"]}`,
        type: "popup",
        width: 300,
        height: 350,
    });
}

openDialog()