let language = "en";
let isDrafted = false;
let guidedDemoRunning = false;
const selectedDemoNotes = new Set();
let template = "neris";
let lastGaps = [];
const sourceIds = ["camera", "radio", "photos", "cad"];
const selectedSources = new Set(sourceIds);
const $ = (selector) => document.querySelector(selector);
const report = $("#reportBody"), state = $("#draftState"), analyze = $("#analyzeBtn"), approve = $("#approveBtn"), proof = $("#proof"), toast = $("#toast"), list = $("#evidenceList"), inspector = $("#evidenceInspector"), finalReview = $("#finalReview");
const citation = (label, source) => `<button class="citation" data-evidence-link="${source}" style="border:0;cursor:pointer">${label}</button>`;
const evidenceDetails = {
  en: {
    camera:["Helmet camera · Crew 2", "VIDEO · 02:37", "Visible smoke conditions and Engine 2’s interior fire-attack activity are recorded in this simulated camera segment."],
    radio:["Radio traffic · TAC 3", "AUDIO TRANSCRIPT · 00:18 / 04:09", "“Engine 2 on scene, smoke showing from the kitchen-side window.”\n“Fire knocked down. Beginning ventilation and overhaul.”"],
    photos:["Scene photos · 01–03", "IMAGE RECORD · 14:10", "Three de-identified stills document exterior staging, smoke conditions, and kitchen-area damage. They do not establish origin or cause."],
    cad:["Dispatch record", "CAD EVENT · 14:02", "Reported residential structure fire. Address: 418 Juniper Street. Dispatch status: verified."],
    note:["Crew clarification", "DEMO NOTE · SELECTED CARD", "This demo uses a prebuilt crew-note card. Production supports direct typed or dictated clarification, always preserved as a cited source."]
  },
  ko: {
    camera:["헬멧 카메라 · 2번 대원조", "영상 · 02:37", "이 가상 카메라 구간에는 연기 상태와 Engine 2의 내부 진압 활동이 기록되어 있습니다."],
    radio:["무전 기록 · TAC 3", "음성 전사 · 00:18 / 04:09", "“Engine 2 현장 도착, 주방 쪽 창문에서 연기 확인.”\n“화재 진압 완료. 환기와 잔불 정리 시작.”"],
    photos:["현장 사진 · 01–03", "이미지 기록 · 14:10", "비식별 사진 3장은 외부 대기 위치, 연기 상태, 주방 구역 손상을 기록합니다. 발화 지점이나 원인을 확정하지는 않습니다."],
    cad:["출동 기록", "CAD 사건 · 14:02", "주거 구조 화재 신고. 주소: 418 Juniper Street. 출동 기록 상태: 확인됨."],
    note:["대원 후속 메모", "데모 카드 · 선택됨", "이 데모는 미리 구성된 대원 메모 카드를 사용합니다. 실제 제품에서는 텍스트·음성 메모를 직접 추가하며, 항상 인용 가능한 근거로 보존합니다."]
  }
};
const demoCrewNotes = {
  en: ["No civilians were assessed or treated.", "All assigned crew members were accounted for at demobilization.", "Utility company notification was requested through dispatch."],
  ko: ["민간인 확인 또는 치료가 없었음.", "철수 시 모든 배정 대원의 인원 확인이 완료되었음.", "출동 기록을 통해 유틸리티 회사 통보를 요청했음."]
};
let activePhoto = 0;
const scenePhotos = [
  "/assets/simulated-scene-photo.png",
  "/assets/simulated-scene-photo-02.png",
  "/assets/simulated-scene-photo-03.png"
];
const scenePhotoCaptions = {
  en: ["PHOTO 01 · Exterior scene and apparatus staging", "PHOTO 02 · Kitchen-side window condition", "PHOTO 03 · Interior kitchen damage"],
  ko: ["사진 01 · 외부 현장과 장비 대기 위치", "사진 02 · 주방 쪽 창문 상태", "사진 03 · 주방 내부 손상 상태"]
};
const text = {
  en: {
    evidence: [["▣","Helmet camera","VIDEO · 04:18 · CREW 2"],["⌁","Radio traffic","AUDIO · 06:03 · TAC 3"],["◫","Scene photos","3 IMAGES · CAPTURED 14:10"],["⌖","Dispatch record","CAD · 14:02 · VERIFIED"]],
    button:"Cross-check evidence &amp; draft <b>→</b>", checking:"Checking local evidence…", ready:"Grounded draft ready", waiting:"Awaiting evidence", status:"OFFLINE DEMO · NO API KEY", reset:"Reset demo", toggle:"한국어", guided:"1-minute demo", guidedRunning:"Demo running…", empty:"<span>⌁</span><h3>Start with what was captured.</h3><p>Run the local evidence checks to build a cited draft. Unsupported fields stay visibly unresolved.</p>", approved:"Demo approval recorded. No report was submitted."
  },
  ko: {
    evidence: [["▣","헬멧 카메라","영상 · 04:18 · 2번 대원조"],["⌁","무전 기록","음성 · 06:03 · TAC 3"],["◫","현장 사진","사진 3장 · 14:10 촬영"],["⌖","출동 기록","CAD · 14:02 · 확인됨"]],
    button:"근거 교차확인 후 초안 만들기 <b>→</b>", checking:"로컬 근거 확인 중…", ready:"근거 기반 초안 준비됨", waiting:"근거 자료 대기", status:"오프라인 데모 · API 키 없음", reset:"데모 초기화", toggle:"English", guided:"1분 데모", guidedRunning:"데모 진행 중…", empty:"<span>⌁</span><h3>현장에 남은 기록부터 시작합니다.</h3><p>로컬 근거 확인을 실행하면 출처가 붙은 초안을 만듭니다. 근거가 없는 항목은 확인이 필요하다고 남습니다.</p>", approved:"데모 승인이 기록되었습니다. 어떤 보고서도 제출되지 않았습니다."
  }
};
function showToast(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3200); }
function showInspector(source) {
  const [title, meta, body] = evidenceDetails[language][source];
  const training = language === "ko" ? "가상 훈련 자료 · 실제 사건 기록 아님" : "SIMULATED TRAINING EVIDENCE · NOT A REAL INCIDENT";
  const photoMedia = `<figure style="margin:0"><img src="${scenePhotos[activePhoto]}" alt="${language === "ko" ? "가상 화재 현장 사진" : "Simulated fire scene photo"}" style="display:block;width:100%;max-height:360px;object-fit:cover"><figcaption style="padding:9px 10px;background:#10211f;color:#fff;font:500 10px 'DM Mono',monospace">${scenePhotoCaptions[language][activePhoto]} · ${training}</figcaption></figure><div style="display:grid;grid-template-columns:34px repeat(3,1fr) 34px;gap:7px;margin-top:9px"><button data-photo-nav="-1" aria-label="Previous photo" style="border:1px solid #dce4df;background:#fff;cursor:pointer">←</button>${scenePhotos.map((path,index) => `<button data-photo-index="${index}" style="padding:0;border:${index === activePhoto ? '3px solid #1a5e4b' : '1px solid #dce4df'};background:#fff;cursor:pointer"><img src="${path}" alt="" style="display:block;width:100%;height:55px;object-fit:cover"></button>`).join("")}<button data-photo-nav="1" aria-label="Next photo" style="border:1px solid #dce4df;background:#fff;cursor:pointer">→</button></div>`;
  const media = source === "camera" ? `<figure style="margin:0 0 16px"><img src="/assets/simulated-helmet-frame.png" alt="${language === "ko" ? "가상 헬멧 카메라 프레임" : "Simulated helmet camera frame"}" style="display:block;width:100%;max-height:360px;object-fit:cover"><figcaption style="padding:9px 10px;background:#10211f;color:#fff;font:500 10px 'DM Mono',monospace">▶ 02:37 &nbsp; ${training}</figcaption></figure>` : source === "photos" ? `<div style="margin:0 0 16px">${photoMedia}</div>` : source === "radio" ? `<div style="margin:0 0 16px;padding:16px;background:#10211f;color:#fff"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:17px">⌁</span><div style="height:24px;flex:1;background:repeating-linear-gradient(90deg,#d8efdf 0 3px,transparent 3px 7px);opacity:.8"></div><span style="font:10px 'DM Mono',monospace">00:18–04:09</span></div><small style="display:block;margin-top:10px;color:#d8efdf;font:500 10px 'DM Mono',monospace">${language === "ko" ? "실제 도입 시 기관 승인 무전 녹음이 연결됩니다 · 데모는 시간대 전사문만 표시" : "APPROVED AGENCY RADIO RECORDING CONNECTS IN PRODUCTION · DEMO SHOWS TIME-ALIGNED TRANSCRIPT"}</small></div>` : "";
  $("#inspectorEyebrow").textContent = language === "ko" ? "근거 탐색기" : "EVIDENCE INSPECTOR";
  $("#inspectorTitle").textContent = title;
  $("#closeInspector").textContent = language === "ko" ? "닫기" : "Close";
  const selectedNotes = [...selectedDemoNotes].map((index) => demoCrewNotes[language][index]);
  $("#inspectorBody").innerHTML = `${media}<p style="margin:0 0 8px;font:500 10px 'DM Mono',monospace;color:#1a5e4b;letter-spacing:.08em">${meta}</p><p style="white-space:pre-line;margin:0">${source === "note" && selectedNotes.length ? selectedNotes.join("\n") : body}</p><p style="margin:15px 0 0;color:#61716d;font-size:11px">${language === "ko" ? "원본 근거는 변경되지 않습니다. 이 데모에서는 비식별 가상 기록을 사용합니다." : "Original evidence remains unchanged. This demo uses de-identified simulated records."}</p>`;
  inspector.hidden = false;
  inspector.scrollIntoView({ behavior:"smooth", block:"nearest" });
}
async function fingerprintBytes(bytes) {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 16);
  }
  return Array.from(new Uint8Array(bytes)).reduce((total, byte) => ((total * 31) + byte) >>> 0, 7).toString(16).toUpperCase();
}
async function fingerprintText(value) { return fingerprintBytes(new TextEncoder().encode(value)); }
async function fingerprintFile(path) { return fingerprintBytes(await (await fetch(path)).arrayBuffer()); }
async function buildEvidenceReceipt() {
  const receipt = $("#evidenceReceipt"), ko = language === "ko";
  receipt.innerHTML = `<p style="margin:0 0 8px;font:500 10px 'DM Mono',monospace;color:#1a5e4b;letter-spacing:.08em">${ko ? "근거 영수증 · 로컬 해시 생성 중" : "EVIDENCE RECEIPT · HASHING LOCALLY"}</p><small style="color:#61716d">${ko ? "선택된 원본 자료의 지문을 만드는 중입니다…" : "Creating fingerprints for selected source material…"}</small>`;
  const records = [];
  if (selectedSources.has("camera")) records.push([ko ? "헬멧 카메라 프레임" : "Helmet camera frame", "02:37", await fingerprintFile("/assets/simulated-helmet-frame.png")]);
  if (selectedSources.has("photos")) {
    for (let index = 0; index < scenePhotos.length; index += 1) records.push([ko ? `현장 사진 ${String(index + 1).padStart(2, "0")}` : `Scene photo ${String(index + 1).padStart(2, "0")}`, `14:10:${String(index * 7).padStart(2, "0")}`, await fingerprintFile(scenePhotos[index])]);
  }
  if (selectedSources.has("radio")) records.push([ko ? "TAC 3 무전 전사" : "TAC 3 radio transcript", "00:18–04:09", await fingerprintText(evidenceDetails.en.radio[2])]);
  if (selectedSources.has("cad")) records.push([ko ? "CAD 출동 기록" : "CAD dispatch record", "14:02", await fingerprintText(evidenceDetails.en.cad[2])]);
  for (const index of selectedDemoNotes) records.push([ko ? `대원 후속 메모 ${String(index + 1).padStart(2, "0")}` : `Crew clarification ${String(index + 1).padStart(2, "0")}`, ko ? "데모 카드" : "Demo card", await fingerprintText(demoCrewNotes[ko ? "ko" : "en"][index])]);
  const rows = records.map(([name, captured, hash]) => `<div style="display:grid;grid-template-columns:1fr auto;gap:6px;padding:7px 0;border-top:1px solid #e7ece8"><span style="font-size:10px">${name}<small style="display:block;color:#61716d">${captured}</small></span><code style="font-size:9px;color:#1a5e4b">${hash}</code></div>`).join("");
  receipt.innerHTML = `<p style="margin:0 0 8px;font:500 10px 'DM Mono',monospace;color:#1a5e4b;letter-spacing:.08em">${ko ? "근거 영수증 · 로컬 해시 완료" : "EVIDENCE RECEIPT · LOCALLY HASHED"}</p>${rows}<small style="display:block;margin-top:9px;color:#61716d;font-size:10px;line-height:1.45">${ko ? "데모: 브라우저가 가상 원본을 SHA-256으로 지문화했습니다. 실제 도입 시 기관 증거 보관소와 연결합니다." : "Demo: the browser fingerprints simulated originals with SHA-256. Production connects to the agency evidence vault."}</small>`;
}
function updateReadyState() {
  const complete = $("#confirmSources").checked && $("#confirmCasualty").checked;
  const remaining = Number(!$("#confirmSources").checked) + Number(!$("#confirmCasualty").checked);
  const korean = language === "ko";
  $("#readyState").textContent = complete ? (korean ? "확인 완료 · 관리자 검토 준비됨" : "Checks complete · Ready for supervisor review") : (korean ? `${remaining}개 확인 항목 남음` : `${remaining} confirmation${remaining === 1 ? "" : "s"} remaining`);
  $("#readyState").style.background = complete ? "#d8efdf" : "#fff5e9";
  const finalize = $("#finalizeReport");
  finalize.disabled = !complete;
  finalize.style.opacity = complete ? "1" : ".35";
  finalize.style.cursor = complete ? "pointer" : "not-allowed";
}
function openFinalReview() {
  const korean = language === "ko";
  $("#reviewTitle").textContent = korean ? "최종 보고서 검토" : "Finalize report";
  $("#reviewCopy").textContent = korean ? "필수 확인을 완료한 뒤 보고서를 인쇄하거나 PDF로 저장하세요." : "Resolve the required confirmations, then print or save the report as a PDF.";
  $("#checklistLabel").textContent = korean ? "필수 검토" : "REQUIRED REVIEW";
  $("#sourcesLabel").textContent = korean ? `누락·제외된 근거 항목을 검토했습니다${lastGaps.length ? ` (${lastGaps.length}개)` : ""}.` : `I reviewed missing or excluded source fields${lastGaps.length ? ` (${lastGaps.length})` : ""}.`;
  $("#casualtyLabel").textContent = korean ? "민간인 부상 상태를 확인했습니다." : "I verified the civilian casualty status.";
  $("#editorLabel").textContent = korean ? "수정 가능한 최종 초안" : "EDITABLE FINAL DRAFT";
  $("#printReport").textContent = korean ? "인쇄 / PDF 저장" : "Print / Save PDF";
  $("#finalizeReport").textContent = korean ? "관리자 검토 준비 완료" : "Ready for supervisor review";
  $("#finalEditor").value = report.innerText.replace(/\n{3,}/g, "\n\n");
  $("#confirmSources").checked = false; $("#confirmCasualty").checked = false;
  updateReadyState(); finalReview.hidden = false; buildEvidenceReceipt();
  finalReview.scrollIntoView({ behavior:"smooth", block:"start" });
}
function renderEvidence() {
  const included = language === "ko" ? "포함됨" : "Included";
  const excluded = language === "ko" ? "제외됨" : "Excluded";
  list.innerHTML = text[language].evidence.map(([icon,title,meta], index) => {
    const id = sourceIds[index], on = selectedSources.has(id);
    return `<button class="evidence" data-source="${id}" aria-pressed="${on}" style="width:100%;text-align:left;cursor:pointer;${on ? 'box-shadow:inset 3px 0 #1a5e4b' : 'opacity:.48'}"><span class="evidence-icon">${icon}</span><div><b>${title}</b><small>${meta}</small><small style="color:${on ? '#1a5e4b' : '#a44125'}">${on ? included : excluded}</small></div></button>`;
  }).join("");
  list.querySelectorAll("[data-source]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.source;
    selectedSources.has(id) ? selectedSources.delete(id) : selectedSources.add(id);
    isDrafted = false; proof.hidden = true; finalReview.hidden = true; approve.disabled = true; state.textContent = text[language].waiting;
    state.style.background = "#f0f1ee"; state.style.color = "#61716d";
    report.innerHTML = `<div class="empty">${text[language].empty}</div>`;
    analyze.disabled = selectedSources.size === 0;
    analyze.innerHTML = selectedSources.size === 0 ? (language === "ko" ? "근거 자료를 하나 이상 선택하세요" : "Select at least one source") : text[language].button;
    renderEvidence();
  }));
}
function renderDemoNotes() {
  const cards = demoCrewNotes[language];
  $("#demoNotes").innerHTML = cards.map((note, index) => `<button data-demo-note="${index}" aria-pressed="${selectedDemoNotes.has(index)}" style="border:1px solid ${selectedDemoNotes.has(index) ? '#1a5e4b' : '#dce4df'};background:${selectedDemoNotes.has(index) ? '#d8efdf' : '#fff'};padding:9px;text-align:left;font:11px/1.4 Manrope;cursor:pointer">${selectedDemoNotes.has(index) ? '✓ ' : ''}${note}</button>`).join("");
  $("#demoNotes").querySelectorAll("[data-demo-note]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.demoNote);
    selectedDemoNotes.has(index) ? selectedDemoNotes.delete(index) : selectedDemoNotes.add(index);
    finalReview.hidden = true;
    if (isDrafted) draft();
    renderDemoNotes();
    showToast(language === "ko" ? "대원 메모 선택 내용을 업데이트했습니다." : "Selected crew clarifications updated.");
  }));
}
function applyKorean() {
  const korean = language === "ko";
  document.documentElement.lang = korean ? "ko" : "en";
  $(".case-status").innerHTML = `<span></span> ${text[language].status}`;
  $("#languageBtn").textContent = text[language].toggle;
  $("#resetBtn").textContent = text[language].reset;
  if (!guidedDemoRunning) $("#guidedDemoBtn").textContent = text[language].guided;
  if (korean) {
    $(".hero .eyebrow").textContent = "화재 사건 보고 업무를 다시 설계하다";
    $("h1").innerHTML = "근거는 남기고.<br><em>시간은 돌려주고.</em>";
    $(".lede").textContent = "현장에 남은 기록을 근거가 보이는 검토용 보고서 초안으로 바꿉니다. 지친 대원이 모든 순간을 다시 기억해낼 필요가 없습니다.";
    $(".safety-card strong").textContent = "사람의 승인 필수";
    $(".safety-card small").textContent = "EmberTrace는 자동 제출·원인 판단·근거 없는 사실 생성을 하지 않습니다.";
    $(".evidence-panel h2").textContent = "사건 근거 자료";
    $(".muted").textContent = "비식별 가상 구조 화재 사건입니다. 이 데모는 로컬 근거 규칙만 사용합니다.";
    $(".micro").textContent = "이 데모는 API 키·업로드·실제 긴급 데이터를 사용하지 않습니다.";
    $("#noteLabel").textContent = "데모용 대원 후속 메모";
    $("#noteHint").textContent = "실제 제품에서는 텍스트 또는 음성으로 후속 메모를 직접 추가할 수 있습니다. 데모는 안전한 미리 구성 카드만 사용합니다.";
    $(".report-head .eyebrow").textContent = "02 · NERIS 준비 초안";
    $(".report-head h2").textContent = "사건 #MVFD-2026-0418";
    $(".report-footer span").textContent = "원본 근거 자료는 변경되지 않습니다";
    approve.textContent = "검토 후 승인";
    $("#proof h2").textContent = "이 초안이 검토 가능한 이유";
  } else { location.reload(); return; }
  renderEvidence(); renderDemoNotes();
  if (!isDrafted) { report.innerHTML = `<div class="empty">${text.ko.empty}</div>`; state.textContent = text.ko.waiting; }
  else draft();
}
function draft() {
  const ko = language === "ko";
  const has = (source) => selectedSources.has(source);
  const gaps = sourceIds.filter((source) => !has(source));
  lastGaps = gaps;
  const missingKo = { camera:"진압·잔불 정리 영상", radio:"현장 무전 확인", photos:"현장 사진", cad:"출동 시각·주소" };
  const missingEn = { camera:"fire attack footage", radio:"radio confirmation", photos:"scene photographs", cad:"dispatch time and address" };
  const summary = has("cad") || has("radio") ? (ko ? `14:02경 Metroville Fire Department는 418 Juniper Street의 주거 구조 화재 신고를 받고 출동했습니다.${has("cad") ? citation("CAD 14:02", "cad") : ""} ${has("radio") ? citation("무전 00:18", "radio") : ""}` : `At approximately 14:02, Metroville Fire Department was dispatched to a reported residential structure fire at 418 Juniper Street.${has("cad") ? citation("CAD 14:02", "cad") : ""} ${has("radio") ? citation("RADIO 00:18", "radio") : ""}`) : (ko ? "출동 시각과 주소를 뒷받침하는 선택된 근거가 없습니다." : "No selected source supports dispatch time or address.");
  const operations = has("camera") || has("radio") ? (ko ? `Engine 2는 정문을 통해 내부 진압을 시작했습니다. 14:11경 눈에 보이는 화재가 진압되었다고 보고했으며, 이후 환기와 잔불 정리를 수행했습니다.${has("camera") ? citation("헬멧캠 02:37", "camera") : ""} ${has("radio") ? citation("무전 04:09", "radio") : ""}` : `Engine 2 initiated interior fire attack through the front entry. The visible fire was reported knocked down at approximately 14:11, followed by ventilation and overhaul.${has("camera") ? citation("HELMET 02:37", "camera") : ""} ${has("radio") ? citation("RADIO 04:09", "radio") : ""}`) : (ko ? "선택된 근거에 현장 활동 내용이 없습니다." : "No selected source supports field operations.");
  const observations = has("photos") ? (ko ? `현장 사진 3장은 연기 상태, 주방 구역 손상, 외부 대원 대기 위치를 기록합니다. 이 자료는 현장 활동 기록을 뒷받침하지만, 발화 지점이나 원인을 확정하지는 않습니다. ${citation("사진 01–03", "photos")}` : `Three scene images document smoke conditions, kitchen-area damage, and exterior crew staging. The available sources support documenting fire department operations; they do not establish origin or cause. ${citation("PHOTO 01–03", "photos")}`) : (ko ? "선택된 근거에 현장 사진이 없습니다." : "No selected source includes scene photographs.");
  const selectedNotes = [...selectedDemoNotes].map((index) => demoCrewNotes[language][index]);
  const noteConfirmsCasualties = selectedNotes.some((note) => /no civilians|no civilian|no casualties|no casualty|민간인.*없|부상.*없|치료.*없/i.test(note));
  const sourceReview = gaps.length ? (ko ? `추가 확인 필요: ${gaps.map((gap) => missingKo[gap]).join(", ")}.` : `Additional review needed: ${gaps.map((gap) => missingEn[gap]).join(", ")}.`) : "";
  const civilianReview = noteConfirmsCasualties ? (ko ? `대원 메모에 따라 민간인 확인·치료 없음으로 기록했습니다. ${citation("대원 메모", "note")}` : `Crew clarification records no civilian assessment or treatment. ${citation("CREW NOTE", "note")}`) : (ko ? "민간인 확인 또는 치료 여부가 승인된 자료에 없습니다." : "No approved source confirms whether civilians were assessed or treated.");
  const missing = [sourceReview, civilianReview].filter(Boolean).join("<br><br>");
  const noteSection = selectedNotes.length ? `<section class="report-section"><h3>${ko ? "대원 후속 메모" : "CREW CLARIFICATIONS"}</h3><ul>${selectedNotes.map((note) => `<li>${note} ${citation(ko ? "대원 메모" : "CREW NOTE", "note")}</li>`).join("")}</ul></section>` : "";
  const addendum = template === "metroville" ? `<section class="report-section"><h3>${ko ? "METROVILLE 추가 기록" : "METROVILLE ADDENDUM"}</h3><p>${ko ? "배치 자원: Engine 2 · 지휘 채널: TAC 3 · 이 기관 추가 기록은 선택된 출동·무전 근거와 연결됩니다." : "Assigned resource: Engine 2 · Command channel: TAC 3 · This local addendum is linked to selected dispatch and radio evidence."} ${has("cad") ? citation("CAD", "cad") : ""} ${has("radio") ? citation(ko ? "무전" : "RADIO", "radio") : ""}</p></section>` : "";
  report.innerHTML = `<section class="report-section"><h3>${ko ? "사건 요약" : "INCIDENT SUMMARY"}</h3><p>${summary}</p></section><section class="report-section"><h3>${ko ? "현장 활동" : "OPERATIONS"}</h3><p>${operations}</p></section><section class="report-section"><h3>${ko ? "관찰 기록" : "OBSERVATIONS"}</h3><p>${observations}</p></section>${noteSection}${addendum}<aside class="review"><b>${ko ? "확인 필요" : "REVIEW REQUIRED"}</b><br>${missing}</aside>`;
  state.textContent = text[language].ready; state.style.background="#d8efdf"; state.style.color="#1a5e4b"; approve.disabled=false; proof.hidden=false;
}
const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[character]);
function renderAiDraft(draft, mode) {
  const ko = language === "ko";
  const links = draft.used_source_ids.map((id) => citation(evidenceDetails[language][id === "note" ? "note" : id][0], id === "note" ? "note" : id)).join(" ");
  const reviews = draft.review_required.length ? draft.review_required.map(escapeHtml).join("<br>") : (ko ? "모델 출력은 사람 검토가 필요합니다." : "Model output requires human review.");
  const label = mode === "gpt-5.6-terra" ? "GPT-5.6" : (ko ? "로컬 시뮬레이션" : "LOCAL SIMULATION");
  report.innerHTML = `<section class="report-section"><h3>${ko ? `사건 요약 · ${label} 초안` : `INCIDENT SUMMARY · ${label} DRAFT`}</h3><p>${escapeHtml(draft.summary)} ${links}</p></section><section class="report-section"><h3>${ko ? "현장 활동" : "OPERATIONS"}</h3><p>${escapeHtml(draft.operations)}</p></section><section class="report-section"><h3>${ko ? "관찰 기록" : "OBSERVATIONS"}</h3><p>${escapeHtml(draft.observations)}</p></section><aside class="review"><b>${ko ? "확인 필요" : "REVIEW REQUIRED"}</b><br>${reviews}</aside>`;
  state.textContent = mode === "gpt-5.6-terra" ? (ko ? "GPT-5.6 초안 준비됨 · 사람 검토 필요" : "GPT-5.6 draft ready · human review required") : (ko ? "로컬 시뮬레이션 초안 · 사람 검토 필요" : "Local simulation draft · human review required");
}
async function enhanceWithAi() {
  try {
    const typedNote = $("#crewNoteInput").value.trim();
    const crewNotes = [...selectedDemoNotes].map((index) => demoCrewNotes[language][index]);
    if (typedNote) crewNotes.push(typedNote);
    const response = await fetch("/api/draft", { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ sourceIds:[...selectedSources], crewNotes }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || "AI adapter unavailable");
    renderAiDraft(result.draft, result.mode);
  } catch (error) {
    showToast(language === "ko" ? `GPT-5.6 어댑터를 사용할 수 없습니다: ${error.message}` : `GPT-5.6 adapter unavailable: ${error.message}`);
  }
}
analyze.addEventListener("click", () => { analyze.disabled=true; analyze.innerHTML=text[language].checking; state.textContent=language === "ko" ? "4개 근거 기록 확인 중" : "Checking 4 source records"; setTimeout(async () => { isDrafted=true; draft(); if ($("#aiAssist").checked) await enhanceWithAi(); analyze.disabled=false; analyze.innerHTML=language === "ko" ? "초안 생성됨 <b>✓</b>" : "Draft generated <b>✓</b>"; },700); });
approve.addEventListener("click", openFinalReview);
$("#confirmSources").addEventListener("change", updateReadyState);
$("#confirmCasualty").addEventListener("change", updateReadyState);
$("#finalizeReport").addEventListener("click", () => showToast(language === "ko" ? "관리자 검토용 최종본으로 표시했습니다. 자동 제출은 하지 않습니다." : "Marked ready for supervisor review. Nothing was submitted automatically."));
$("#printReport").addEventListener("click", () => window.print());
$("#templateSelect").addEventListener("change", (event) => { template = event.target.value; if (isDrafted) draft(); });
document.addEventListener("click", (event) => {
  const photo = event.target.closest("[data-photo-index]");
  if (photo) { activePhoto = Number(photo.dataset.photoIndex); showInspector("photos"); return; }
  const photoNav = event.target.closest("[data-photo-nav]");
  if (photoNav) { activePhoto = (activePhoto + Number(photoNav.dataset.photoNav) + scenePhotos.length) % scenePhotos.length; showInspector("photos"); return; }
  const link = event.target.closest("[data-evidence-link]");
  if (link) showInspector(link.dataset.evidenceLink);
});
$("#closeInspector").addEventListener("click", () => { inspector.hidden = true; });
$("#languageBtn").addEventListener("click", () => { language = language === "en" ? "ko" : "en"; applyKorean(); });
$("#resetBtn").addEventListener("click", () => location.reload());
$("#guidedDemoBtn").addEventListener("click", async () => {
  if (guidedDemoRunning) return;
  guidedDemoRunning = true;
  const demoButton = $("#guidedDemoBtn");
  demoButton.disabled = true;
  demoButton.textContent = text[language].guidedRunning;
  selectedSources.clear(); sourceIds.forEach((source) => selectedSources.add(source));
  selectedDemoNotes.clear(); isDrafted = false;
  proof.hidden = true; finalReview.hidden = true; inspector.hidden = true; approve.disabled = true;
  analyze.disabled = false; analyze.innerHTML = text[language].button;
  state.textContent = text[language].waiting;
  report.innerHTML = `<div class="empty">${text[language].empty}</div>`;
  renderEvidence(); renderDemoNotes();
  $(".workspace").scrollIntoView({ behavior:"smooth", block:"start" });
  showToast(language === "ko" ? "1/3 · 4개 근거 기록을 확인합니다." : "1/3 · Checking four captured sources.");
  await new Promise((resolve) => setTimeout(resolve, 650));
  analyze.click();
  await new Promise((resolve) => setTimeout(resolve, 1100));
  [0, 1, 2].forEach((index) => selectedDemoNotes.add(index));
  renderDemoNotes(); draft();
  showToast(language === "ko" ? "2/3 · 대원 후속 메모 3개를 근거로 연결했습니다." : "2/3 · Linked three crew clarifications as sources.");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  openFinalReview();
  showToast(language === "ko" ? "3/3 · 최종 검토와 근거 영수증을 준비했습니다. 사람의 확인은 자동으로 건너뛰지 않습니다." : "3/3 · Final review and evidence receipt are ready. Human checks remain manual.");
  demoButton.disabled = false;
  demoButton.textContent = text[language].guided;
  guidedDemoRunning = false;
});
renderEvidence();
renderDemoNotes();
