const API = "http://localhost:8080/api";
const form = document.getElementById("studentForm");
const tableBody = document.getElementById("studentTable");
const dateInput = document.getElementById("attendanceDate");
const message = document.getElementById("message");

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
dateInput.value = localDateString();

function showMessage(text, isError=false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
async function request(url, options={}) {
  const response = await fetch(url, {
    headers: {"Content-Type":"application/json", ...(options.headers || {})},
    ...options
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { const body = await response.json(); detail = body.message || body.error || detail; } catch {}
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

async function loadAttendance() {
  const date = dateInput.value;
  if (!date) return;
  tableBody.innerHTML = '<tr><td colspan="7" class="empty">Loading…</td></tr>';
  try {
    const rows = await request(`${API}/attendance/summary?date=${encodeURIComponent(date)}`);
    renderRows(rows);
    document.getElementById("totalStudents").textContent = rows.length;
    document.getElementById("presentCount").textContent = rows.filter(r => r.status === "PRESENT").length;
    document.getElementById("absentCount").textContent = rows.filter(r => r.status === "ABSENT").length;
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(error.message)}. Check that the Spring Boot backend and MySQL are running.</td></tr>`;
    showMessage("Could not load data: " + error.message, true);
  }
}
function renderRows(rows) {
  if (!rows.length) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty">No students yet. Add a student above to get started.</td></tr>';
    return;
  }
  tableBody.innerHTML = rows.map(r => `
    <tr data-id="${r.studentId}">
      <td>${escapeHtml(r.rollNumber)}</td>
      <td>${escapeHtml(r.studentName)}</td>
      <td><select class="status-select" aria-label="Attendance status for ${escapeHtml(r.studentName)}">
        <option value="UNMARKED" ${!r.status ? "selected" : ""}>Not marked</option>
        <option value="PRESENT" ${r.status === "PRESENT" ? "selected" : ""}>Present</option>
        <option value="ABSENT" ${r.status === "ABSENT" ? "selected" : ""}>Absent</option>
      </select></td>
      <td>${r.presentDays}</td><td>${r.absentDays}</td>
      <td class="percent">${Number(r.percentage).toFixed(1)}%</td>
      <td><button class="secondary save-btn">Save</button> <button class="danger delete-btn">Delete</button></td>
    </tr>`).join("");
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  const rollNumber = document.getElementById("rollNumber").value.trim();
  if (!name || !rollNumber) return;
  try {
    await request(`${API}/students`, {method:"POST", body:JSON.stringify({name, rollNumber})});
    form.reset();
    showMessage("Student added successfully.");
    await loadAttendance();
  } catch (error) { showMessage(error.message, true); }
});
dateInput.addEventListener("change", loadAttendance);
tableBody.addEventListener("click", async event => {
  const row = event.target.closest("tr[data-id]");
  if (!row) return;
  const id = row.dataset.id;
  if (event.target.classList.contains("save-btn")) {
    const status = row.querySelector(".status-select").value;
    if (status === "UNMARKED") {
      showMessage("Choose Present or Absent before saving.", true);
      return;
    }
    const button = event.target;
    button.disabled = true;
    try {
      await request(`${API}/attendance`, {method:"POST", body:JSON.stringify({
        studentId:Number(id), date:dateInput.value, status
      })});
      showMessage("Attendance saved successfully.");
      await loadAttendance();
    } catch (error) { showMessage(error.message, true); }
    finally { button.disabled = false; }
  }
  if (event.target.classList.contains("delete-btn")) {
    if (!confirm("Delete this student and their attendance records?")) return;
    try {
      await request(`${API}/students/${id}`, {method:"DELETE"});
      showMessage("Student deleted.");
      await loadAttendance();
    } catch (error) { showMessage(error.message, true); }
  }
});
loadAttendance();
