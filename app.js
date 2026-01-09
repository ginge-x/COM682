const UPLOAD_URL = "https://prod-10.francecentral.logic.azure.com:443/workflows/c3919603ee93424bb4d711fa61556cbf/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=0jHasonj6y-YstCME7R1voCdLANKHyOxLUVG9-8Vxfw";
const LIST_URL   = "https://prod-12.francecentral.logic.azure.com:443/workflows/d1943473a93f414e96823ee052373f19/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=6uJg8AndAzhdR9xzWp1VcFNebe4J3t7SbJndw7AKbFE";
const DELETE_URL = "https://prod-24.francecentral.logic.azure.com:443/workflows/80585b8a6acc400ab305e1d4078b2dc5/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=p3XWiRV8AE71gDo5JBZs8F3YsMTyfMC38nZyjm91h3o";
const UPDATE_URL = "https://prod-05.francecentral.logic.azure.com:443/workflows/92f63935ef4c44d39c6e2d99b90977cb/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=UnMQy0tIJOAvwZnUODogrxI2NuEOLqfOcGfD_CI5DMo";

const COMMENTS_LIST_URL   = "https://prod-12.francecentral.logic.azure.com:443/workflows/37e1356c8c9b4bafb535707d20d73080/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=qyKNvZQO6Zk16itUsFI5JBsYhQxyRfxSlMJGFSZ1Jm8";
const COMMENTS_CREATE_URL = "https://prod-24.francecentral.logic.azure.com:443/workflows/62d4647c29f647239f70dcc0af7b4984/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=VCtslDRafm4njn27h2pFR6r29AoVZEukVxzLHoWPzPE";
const COMMENTS_DELETE_URL = "https://prod-06.francecentral.logic.azure.com:443/workflows/c0c2da83895c4eae8b52f356aa3f5b3a/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=4G-TMmr74HHyQnipgaNiL4H8fVIa4yrZP7S6zpGd6m8";
const COMMENTS_UPDATE_URL = "https://prod-08.francecentral.logic.azure.com:443/workflows/3ea280e3deb54bf1a387537286e1dd59/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=9UOCWR6zMfO42z2ICRBMoM3zKbtFtLgsdOezU1xb0Qk";

const uploadsDiv = document.getElementById("uploads");
const searchInput = document.getElementById("searchInput");
const uploadStatus = document.getElementById("uploadStatus");
const sentinel = document.getElementById("sentinel");

let cachedUploads = [];
let filteredUploads = [];
let renderIndex = 0;
const PAGE_SIZE = 6;

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function safeText(v) { return v == null ? "" : String(v); }

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function pickMediaType(item) {
  const ct = (item.contentType || "").toLowerCase();
  const mt = (item.mediaType || "").toLowerCase();
  const name = (item.originalName || item.blobName || item.blobUrl || "").toLowerCase();

  if (mt === "image" || ct.startsWith("image/")) return "image";
  if (mt === "video" || ct.startsWith("video/")) return "video";

  if (/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(name)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(name)) return "video";

  return "other";
}

function createMediaElement(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "media";

  const url = item.blobUrl;
  if (!url) return wrapper;

  const a = document.createElement("a");
  a.href = url;
  a.textContent = "Open media";
  a.target = "_blank";
  a.rel = "noreferrer";
  wrapper.appendChild(a);

  const kind = pickMediaType(item);

  const shell = document.createElement("div");
  shell.className = "previewShell";

  const hint = document.createElement("div");
  hint.className = "previewHint";

  if (kind === "image") {
    const img = document.createElement("img");
    img.className = "preview";
    img.loading = "lazy";
    img.src = url;
    img.onerror = () => { shell.remove(); };
    hint.textContent = item.originalName ? safeText(item.originalName) : "Image preview";
    shell.appendChild(img);
    shell.appendChild(hint);
    wrapper.appendChild(shell);
  } else if (kind === "video") {
    const vid = document.createElement("video");
    vid.className = "preview";
    vid.controls = true;
    vid.preload = "metadata";
    vid.src = url;
    vid.onerror = () => { shell.remove(); };
    hint.textContent = item.originalName ? safeText(item.originalName) : "Video preview";
    shell.appendChild(vid);
    shell.appendChild(hint);
    wrapper.appendChild(shell);
  } else {
    const msg = document.createElement("div");
    msg.className = "previewShell";
    const hint2 = document.createElement("div");
    hint2.className = "previewHint";
    hint2.textContent = "No preview available (unknown type).";
    msg.appendChild(hint2);
    wrapper.appendChild(msg);
  }

  return wrapper;
}

function deleteReview(id) {
  if (!confirm("Delete this review?")) return;
  fetch(`${DELETE_URL}&id=${encodeURIComponent(id)}`, { method: "DELETE" })
    .then((res) => { if (!res.ok) throw new Error("Delete failed: " + res.status); return res.text(); })
    .then(() => loadUploads())
    .catch((err) => alert(err.message));
}

function editTitle(id, currentTitle) {
  const newTitle = prompt("Enter new review title:", currentTitle || "");
  if (newTitle == null) return;
  if (!newTitle.trim()) return alert("Title cannot be empty.");

  fetch(UPDATE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: String(id), fileName: String(newTitle) }),
  })
    .then((res) => { if (!res.ok) throw new Error("Update failed: " + res.status); return res.text(); })
    .then(() => loadUploads())
    .catch((err) => alert(err.message));
}

function editReviewText(id, currentText) {
  const newText = prompt("Edit review text:", currentText || "");
  if (newText == null) return;
  if (!newText.trim()) return alert("Review text cannot be empty.");

  fetch(UPDATE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: String(id), reviewText: String(newText) }),
  })
    .then((res) => { if (!res.ok) throw new Error("Update failed: " + res.status); return res.text(); })
    .then(() => loadUploads())
    .catch((err) => alert(err.message));
}

async function loadComments(uploadId, commentsListEl) {
  commentsListEl.textContent = "Loading...";
  try {
    const url = `${COMMENTS_LIST_URL}&uploadId=${encodeURIComponent(uploadId)}`;
    const data = await fetchJson(url);
    const comments = Array.isArray(data) ? data : (data && (data.Documents || data.documents || data.value)) || [];
    commentsListEl.innerHTML = "";

    if (!comments.length) {
      commentsListEl.textContent = "(no comments yet)";
      return;
    }

    comments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    comments.forEach((c) => {
      const row = document.createElement("div");
      row.className = "commentRow";

      const body = document.createElement("div");
      body.className = "commentBody";

      const line = document.createElement("div");
      const name = document.createElement("span");
      name.className = "commentName";
      name.textContent = safeText(c.userName || "Anon");

      const text = document.createElement("span");
      text.textContent = safeText(c.text);

      line.appendChild(name);
      line.appendChild(document.createTextNode(": "));
      line.appendChild(text);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = c.createdAt ? fmtDate(c.createdAt) : "";

      body.appendChild(line);
      if (meta.textContent) body.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "commentActions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = async () => {
        const newText = prompt("Edit comment:", safeText(c.text));
        if (newText == null) return;
        if (!newText.trim()) return alert("Comment cannot be empty.");
        try {
          await updateComment(c.id, c.pk, newText);
          await loadComments(uploadId, commentsListEl);
        } catch (e) {
          alert(e.message);
        }
      };

      const delBtn = document.createElement("button");
      delBtn.className = "btn";
      delBtn.textContent = "Delete";
      delBtn.onclick = async () => {
        if (!confirm("Delete this comment?")) return;
        try {
          await deleteComment(c.id, c.pk);
          await loadComments(uploadId, commentsListEl);
        } catch (e) {
          alert(e.message);
        }
      };

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(body);
      row.appendChild(actions);
      commentsListEl.appendChild(row);
    });
  } catch (e) {
    commentsListEl.textContent = "(failed to load comments)";
    console.error(e);
  }
}

async function postComment(uploadId, nameInput, textInput, commentsListEl) {
  const userName = nameInput.value.trim();
  const text = textInput.value.trim();
  if (!userName || !text) return alert("Enter name + comment.");

  try {
    await fetchJson(COMMENTS_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: String(uploadId), userName, text }),
    });
    textInput.value = "";
    await loadComments(uploadId, commentsListEl);
  } catch (e) {
    alert("Failed to post comment.");
    console.error(e);
  }
}

async function deleteComment(commentId, commentPk) {
  const res = await fetch(
    `${COMMENTS_DELETE_URL}&id=${encodeURIComponent(commentId)}&pk=${encodeURIComponent(commentPk)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Delete failed: ${res.status} ${t}`);
  }
}

async function updateComment(commentId, commentPk, newText) {
  const res = await fetch(COMMENTS_UPDATE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: String(commentId), pk: String(commentPk), text: String(newText) }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Update failed: ${res.status} ${t}`);
  }
}

function resetFeed(items) {
  uploadsDiv.innerHTML = "";
  filteredUploads = items;
  renderIndex = 0;
  renderNextPage();
}

function renderNextPage() {
  const slice = filteredUploads.slice(renderIndex, renderIndex + PAGE_SIZE);
  renderIndex += slice.length;
  slice.forEach(renderCard);

  if (!filteredUploads.length) {
    uploadsDiv.textContent = "(no uploads yet)";
  }
}

function renderCard(item) {
  const card = document.createElement("div");
  card.className = "card";

  const top = document.createElement("div");
  top.className = "cardTop";

  const left = document.createElement("div");

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = safeText(item.fileName);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent =
    `${safeText(item.userName || "Anon")}` +
    (item.userID ? ` • userID: ${safeText(item.userID)}` : "") +
    (item.createdAt ? ` • ${fmtDate(item.createdAt)}` : "");

  left.appendChild(title);
  left.appendChild(meta);

  const right = document.createElement("div");
  const delBtn = document.createElement("button");
  delBtn.className = "btn";
  delBtn.textContent = "Delete";
  delBtn.onclick = () => deleteReview(item.id);

  const editBtn = document.createElement("button");
  editBtn.className = "btn";
  editBtn.textContent = "Edit Title";
  editBtn.style.marginLeft = "8px";
  editBtn.onclick = () => editTitle(item.id, item.fileName);

  const editTextBtn = document.createElement("button");
  editTextBtn.className = "btn";
  editTextBtn.textContent = "Edit Review Text";
  editTextBtn.style.marginLeft = "8px";
  editTextBtn.onclick = () => editReviewText(item.id, item.reviewText);

  right.appendChild(delBtn);
  right.appendChild(editBtn);
  right.appendChild(editTextBtn);

  top.appendChild(left);
  top.appendChild(right);

  const reviewText = document.createElement("div");
  reviewText.className = "reviewText";
  reviewText.textContent = safeText(item.reviewText);

  let translationBtn = null;
  let translationDiv = null;

  if (safeText(item.translatedText).trim()) {
    translationBtn = document.createElement("button");
    translationBtn.className = "btn";
    translationBtn.textContent = "Show translation";
    translationBtn.style.marginTop = "8px";

    translationDiv = document.createElement("div");
    translationDiv.className = "reviewText translatedText";
    translationDiv.style.display = "none";
    translationDiv.textContent = safeText(item.translatedText);

    translationBtn.onclick = () => {
      const open = translationDiv.style.display !== "none";
      translationDiv.style.display = open ? "none" : "block";
      translationBtn.textContent = open ? "Show translation" : "Hide translation";
    };
  }

  const mediaEl = createMediaElement(item);

  const commentsWrap = document.createElement("div");
  commentsWrap.className = "comments";

  const commentsHeader = document.createElement("div");
  commentsHeader.className = "panelHeader";
  commentsHeader.style.marginBottom = "8px";

  const h = document.createElement("div");
  h.style.fontWeight = "800";
  h.textContent = "Comments";

  const commentsListEl = document.createElement("div");
  commentsListEl.textContent = "(no comments yet)";

  const refresh = document.createElement("button");
  refresh.className = "btn";
  refresh.textContent = "Refresh";
  refresh.onclick = () => loadComments(item.id, commentsListEl);

  commentsHeader.appendChild(h);
  commentsHeader.appendChild(refresh);

  const form = document.createElement("div");
  form.className = "commentForm";

  const nameInput = document.createElement("input");
  nameInput.className = "nameInput";
  nameInput.placeholder = "Your name";

  const textInput = document.createElement("input");
  textInput.className = "textInput";
  textInput.placeholder = "Write a comment...";

  const postBtn = document.createElement("button");
  postBtn.className = "btn btnPrimary";
  postBtn.textContent = "Post";
  postBtn.onclick = () => postComment(item.id, nameInput, textInput, commentsListEl);

  form.appendChild(nameInput);
  form.appendChild(textInput);
  form.appendChild(postBtn);

  commentsWrap.appendChild(commentsHeader);
  commentsWrap.appendChild(commentsListEl);
  commentsWrap.appendChild(form);

  loadComments(item.id, commentsListEl);

  card.appendChild(top);
  card.appendChild(reviewText);

  if (translationBtn && translationDiv) {
    card.appendChild(translationBtn);
    card.appendChild(translationDiv);
  }

  card.appendChild(mediaEl);
  card.appendChild(commentsWrap);

  uploadsDiv.appendChild(card);
}

async function loadUploads() {
  try {
    const data = await fetchJson(LIST_URL);
    const items = Array.isArray(data) ? data : (data && (data.Documents || data.documents || data.value)) || [];

    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    cachedUploads = items;
    applySearchAndRender();
  } catch (err) {
    uploadsDiv.textContent = "Failed to load uploads.";
    console.error(err);
  }
}

function applySearchAndRender() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const items = !q ? cachedUploads : cachedUploads.filter((x) => {
    const hay = [x.fileName, x.userName, x.reviewText].map(safeText).join(" ").toLowerCase();
    return hay.includes(q);
  });
  resetFeed(items);
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const f = document.getElementById("fileInput").files[0];
  if (!f) return alert("Choose a file first.");

  const userName = document.getElementById("userName").value.trim();
  const userID = document.getElementById("userID").value.trim();
  const fileName = document.getElementById("fileName").value.trim();
  const reviewText = document.getElementById("reviewText").value.trim();

  if (!userName || !userID || !fileName || !reviewText) {
    return alert("Please fill in all fields.");
  }

  const contentType = f.type || "application/octet-stream";
  const mediaType = contentType.startsWith("image/") ? "image"
                  : contentType.startsWith("video/") ? "video"
                  : "other";

  const formData = new FormData();
  formData.append("File", f);
  formData.append("FileName", fileName);
  formData.append("ReviewText", reviewText);
  formData.append("userID", userID);
  formData.append("userName", userName);
  formData.append("OriginalName", f.name);
  formData.append("ContentType", contentType);
  formData.append("MediaType", mediaType);

  uploadStatus.textContent = "Uploading...";

  try {
    const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Upload failed: ${res.status} ${t}`);
    }

    uploadStatus.textContent = "Uploaded ✅";
    document.getElementById("uploadForm").reset();
    await loadUploads();
  } catch (err) {
    uploadStatus.textContent = "";
    alert(err.message);
  }
});

document.getElementById("clearForm").addEventListener("click", () => {
  document.getElementById("uploadForm").reset();
  uploadStatus.textContent = "";
});

document.getElementById("refreshAll").addEventListener("click", () => loadUploads());

document.getElementById("scrollToCreate").addEventListener("click", () => {
  document.getElementById("create").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", applySearchAndRender);

const io = new IntersectionObserver((entries) => {
  const e = entries[0];
  if (!e.isIntersecting) return;
  if (renderIndex >= filteredUploads.length) return;
  renderNextPage();
});
io.observe(sentinel);

loadUploads();
