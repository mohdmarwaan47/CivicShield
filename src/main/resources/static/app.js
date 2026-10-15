const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let reports = [];
let map, pickerMap, markerLayer, pickerMarker;
let selectedCoords = null;
let currentView = "overview";
let toastTimer;

const categoryIcons = {
  "Pothole": {icon:"⌁", cls:"pothole"},
  "Broken streetlight": {icon:"☼", cls:"light"},
  "Damaged sidewalk": {icon:"▱", cls:"sidewalk"},
  "Road obstruction": {icon:"↗", cls:"road"},
  "Open manhole": {icon:"!", cls:"manhole"},
  "Other": {icon:"•", cls:"sidewalk"}
};
const pad = n => String(n).padStart(2,"0");
const reportCode = id => `CS-${String(id).padStart(4,"0")}`;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusClass = status => status.toLowerCase().replace(/\s+/g,"-");
const severityClass = severity => severity.toLowerCase();

function formatDate(value) {
  if (!value) return "Just now";

  let dateValue = String(value);

  // Treat timezone-less backend timestamps as UTC.
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dateValue)) {
    dateValue += "Z";
  }

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Recently";

  const diff = Math.max(0, Date.now() - d.getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"),3300);
}
function setToday() {
  $("#todayLabel").textContent = new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
}
function initializeMap() {
  if (!window.L) {
    $("#map").innerHTML = '<div class="empty-state">Map tiles need an internet connection.</div>';
    return;
  }
  map = L.map("map",{zoomControl:true,scrollWheelZoom:false}).setView([13.045,80.245],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'}).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}
function markerIcon(severity) {
  const color = severity==="Critical" ? "#d94e59" : severity==="High" ? "#df9633" : "#198b68";
  return L.divIcon({className:"",html:`<div style="width:27px;height:27px;border:3px solid white;border-radius:50% 50% 50% 5px;transform:rotate(-45deg);background:${color};box-shadow:0 3px 10px #17253b35;display:grid;place-items:center"><span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:800">!</span></div>`,iconSize:[27,27],iconAnchor:[13,25],popupAnchor:[0,-24]});
}
function renderMap() {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();
  reports.filter(r=>Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)).forEach(r=>{
    L.marker([r.latitude,r.longitude],{icon:markerIcon(r.severity)}).bindPopup(
      `<strong>${escapeHtml(r.title)}</strong><br>${escapeHtml(r.location)}<br><span style="color:#718096">${escapeHtml(r.severity)} · ${escapeHtml(r.status)}</span>`
    ).addTo(markerLayer);
  });
}
async function loadReports() {
  try {
    const [reportResponse, statsResponse] = await Promise.all([fetch("/api/reports"),fetch("/api/stats")]);
    if (!reportResponse.ok || !statsResponse.ok) throw new Error("API request failed");
    reports = await reportResponse.json();
    const stats = await statsResponse.json();
    $("#statTotal").textContent = stats.total;
    $("#statOpen").textContent = stats.open;
    $("#statCritical").textContent = stats.critical;
    $("#statRate").innerHTML = `${stats.resolutionRate}<small>%</small>`;
    $("#sideReportCount").textContent = pad(reports.length);
    $("#reportTotalBadge").textContent = pad(reports.length);
    renderReports();
    renderMap();
    renderAnalytics();
  } catch (error) {
    $("#reportRows").innerHTML = '<tr><td colspan="6" class="empty-state">Could not load reports. Make sure the Java application is running.</td></tr>';
    notify("Unable to connect to the CivicShield API. Check that the app is running.");
  }
}
function renderReports() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const status = $("#statusFilter").value;
  const severity = $("#severityFilter").value;
  const filtered = reports.filter(r => {
    const searchable = [r.title,r.location,r.category,reportCode(r.id),r.description].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (!status || r.status===status) && (!severity || r.severity===severity);
  });
  $("#showingLabel").textContent = `Showing ${filtered.length} of ${reports.length} reports`;
  if (!filtered.length) {
    $("#reportRows").innerHTML = '<tr><td colspan="6" class="empty-state">No reports match your filters. Try a different search.</td></tr>';
    return;
  }
  $("#reportRows").innerHTML = filtered.map(r => {
    const meta = categoryIcons[r.category] || categoryIcons.Other;
    return `<tr>
      <td><div class="report-main"><span class="report-symbol ${meta.cls}">${meta.icon}</span><div><div class="report-name" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</div><div class="report-id">${reportCode(r.id)} · ${escapeHtml(r.category)}</div></div></div></td>
      <td class="location-cell" title="${escapeHtml(r.location)}">⌖ &nbsp;${escapeHtml(r.location)}</td>
      <td><span class="priority ${severityClass(r.severity)}">${escapeHtml(r.severity)}</span></td>
      <td><span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span></td>
      <td>${formatDate(r.createdAt)}</td>
      <td><button class="row-menu" data-action="status" data-id="${r.id}" title="Update report status" aria-label="Update ${escapeHtml(r.title)}">···</button></td>
    </tr>`;
  }).join("");
}
function renderAnalytics() {
  const categories = {};
  reports.forEach(r=>categories[r.category]=(categories[r.category]||0)+1);
  const max = Math.max(1,...Object.values(categories));
  $("#categoryChart").innerHTML = Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([name,count])=>`<div class="bar-row"><span>${escapeHtml(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${count/max*100}%"></div></div><strong>${count}</strong></div>`).join("") || '<p class="field-hint">No reports yet.</p>';
  const statuses = ["Submitted","Verified","In Progress","Resolved"];
  $("#statusChart").innerHTML = statuses.map(s=>`<div class="status-summary"><strong>${reports.filter(r=>r.status===s).length}</strong><span>${s}</span></div>`).join("");
}
function setView(view) {
  currentView = view;
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("#breadcrumbPage").textContent = ({overview:"Overview",reports:"All reports",map:"Hazard map",analytics:"Insights"})[view] || "Overview";
  $("#analyticsPanel").hidden = view!=="analytics";
  $("#reportsPanel").hidden = view==="analytics";
  $("#mapPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
  if (view==="map") {
    $("#mapPanel").scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>map&&map.invalidateSize(),250);
  } else if(view==="reports") {
    $("#reportsPanel").scrollIntoView({behavior:"smooth",block:"start"});
  } else if(view==="analytics") {
    $("#analyticsPanel").scrollIntoView({behavior:"smooth",block:"start"});
  } else {
    window.scrollTo({top:0,behavior:"smooth"});
  }
  $("#sidebar").classList.remove("open");
}
function openModal() {
  $("#reportModal").classList.add("open");
  $("#reportModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(()=>{initPickerMap(); if(pickerMap)pickerMap.invalidateSize();},120);
  setTimeout(()=>$("#reportForm [name=title]").focus(),150);
}
function closeModal() {
  $("#reportModal").classList.remove("open");
  $("#reportModal").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}
function initPickerMap() {
  if (!window.L || pickerMap) return;
  pickerMap = L.map("pickerMap",{scrollWheelZoom:false}).setView([13.045,80.245],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(pickerMap);
  pickerMap.on("click",e=>setPickerMarker(e.latlng.lat,e.latlng.lng));
}
function setPickerMarker(lat, lng) {
  selectedCoords={latitude:Number(lat.toFixed(6)),longitude:Number(lng.toFixed(6))};
  if(!pickerMap)return;
  if(pickerMarker)pickerMarker.setLatLng([lat,lng]);
  else pickerMarker=L.marker([lat,lng],{draggable:true}).addTo(pickerMap);
  pickerMarker.bindPopup("Selected report location").openPopup();
  pickerMarker.off("dragend").on("dragend",e=>{const p=e.target.getLatLng();selectedCoords={latitude:Number(p.lat.toFixed(6)),longitude:Number(p.lng.toFixed(6))};});
}

async function submitReport(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const button = $("#submitReport");
  if (button.disabled) return;

  button.disabled = true;
  button.textContent = "Submitting…";

  const data = Object.fromEntries(new FormData(form).entries());
  if (selectedCoords) Object.assign(data, selectedCoords);

  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        responseText || `Server rejected the report (${response.status})`
      );
    }

    let created;

    try {
      created = JSON.parse(responseText);
    } catch {
      throw new Error("Server did not return a valid confirmation.");
    }

    if (!created || created.id == null) {
      throw new Error("Server did not confirm the saved report.");
    }

    form.reset();
    selectedCoords = null;

    if (pickerMarker && pickerMap) {
      pickerMap.removeLayer(pickerMarker);
      pickerMarker = null;
    }

    closeModal();

    notify(`Report ${reportCode(created.id)} submitted successfully.`);

    // Refresh the dashboard separately.
    // A refresh failure does not mean the report submission failed.
    await loadReports();

  } catch (error) {
    console.error("Report submission failed:", error);
    notify(
      "Report submission could not be confirmed. Check your reports before retrying."
    );
  } finally {
    button.disabled = false;
    button.innerHTML = 'Submit report <span>→</span>';
  }
}

async function updateStatus(id) {
  const report=reports.find(r=>r.id===Number(id));
  if(!report)return;
  const options=["Submitted","Verified","In Progress","Resolved"];
  const current=options.indexOf(report.status);
  const next=options[(current+1)%options.length];
  try {
    const response=await fetch(`/api/reports/${id}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next})});
    if(!response.ok)throw new Error();
    await loadReports();
    notify(`${reportCode(id)} status updated to ${next}.`);
  } catch { notify("Could not update status."); }
}
function setupEvents() {
  ["topReportBtn","quickReportBtn","sideReportBtn"].forEach(id=>$("#"+id).addEventListener("click",openModal));
  ["closeModal","cancelModal"].forEach(id=>$("#"+id).addEventListener("click",closeModal));
  $("#reportModal").addEventListener("click",e=>{if(e.target===$("#reportModal"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  $("#reportForm").addEventListener("submit",submitReport);
  $("#refreshBtn").addEventListener("click",()=>loadReports().then(()=>notify("Community reports refreshed.")));
  ["searchInput","statusFilter","severityFilter"].forEach(id=>$("#"+id).addEventListener(id==="searchInput"?"input":"change",renderReports));
  $("#reportRows").addEventListener("click",e=>{const btn=e.target.closest("[data-action=status]");if(btn)updateStatus(btn.dataset.id);});
  $$(".nav-item").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
  $("#seeAllBtn").addEventListener("click",()=>setView("reports"));
  $("#viewMapBtn").addEventListener("click",()=>{setView("map");setTimeout(()=>map&&map.invalidateSize(),250);});
  $("#useDemoLocation").addEventListener("click",()=>{
    if(!pickerMap)initPickerMap();
    const point=[13.0604,80.2496];
    pickerMap.setView(point,15);setPickerMarker(point[0],point[1]);
    const locationField=$("#reportForm [name=location]");
    if(!locationField.value)locationField.value="Anna Salai, Chennai (demo location)";
  });
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  window.addEventListener("resize",()=>{if(map)map.invalidateSize();if(pickerMap)pickerMap.invalidateSize();});
}
setToday();
setupEvents();
initializeMap();
loadReports();
setInterval(renderReports, 60000);
