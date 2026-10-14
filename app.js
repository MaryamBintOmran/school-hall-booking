const STORAGE_KEY = "schoolHallBookingsDemo";
const form = document.getElementById("bookingForm");
const message = document.getElementById("message");
const list = document.getElementById("bookingList");
const count = document.getElementById("count");

const readBookings = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const saveBookings = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const fmtDate = date => new Date(date + "T12:00:00").toLocaleDateString("ar-KW", {year:"numeric",month:"long",day:"numeric"});
const overlaps = (a,b) => a.date === b.date && a.start < b.end && b.start < a.end;

function render() {
  const bookings = readBookings().sort((a,b) => (a.date+a.start).localeCompare(b.date+b.start));
  count.textContent = `${bookings.length} حجز`;
  if (!bookings.length) {
    list.innerHTML = '<div class="empty">ماكو حجوزات مسجلة للحين</div>';
    return;
  }
  list.innerHTML = bookings.map(b => `
    <article class="booking">
      <div><strong>${escapeHtml(b.purpose)}</strong><small>${fmtDate(b.date)} • ${b.start} إلى ${b.end}</small></div>
    
    </article>`).join("");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const booking = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    teacher: document.getElementById("teacher").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    date: document.getElementById("date").value,
    
    start: document.getElementById("start").value,
    end: document.getElementById("end").value
  };
  if (!booking.date || !booking.start || !booking.end || booking.start >= booking.end) {
    message.className = "error"; message.textContent = "تأكدي من التاريخ، وأن وقت النهاية بعد وقت البداية."; return;
  }
  const bookings = readBookings();
  if (bookings.some(existing => overlaps(existing, booking))) {
    message.className = "error"; message.textContent = "عذرًا، هذا الوقت محجوز. اختاري وقتًا آخر."; return;
  }
  bookings.push(booking); saveBookings(bookings); render(); form.reset();
  message.className = "success"; message.textContent = "تم تسجيل الحجز التجريبي بنجاح على هذا الجهاز.";
});
document.getElementById("exportBtn").addEventListener("click", () => {
  const bookings = readBookings();
  const rows = [["اسم المعلمة","الغرض","التاريخ","البداية","النهاية"], ...bookings.map(b => [b.teacher,b.purpose,b.date,b.start,b.end])];
  const csv = "\uFEFF" + rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
  const a = document.createElement("a"); a.href=url; a.download="school-hall-bookings.csv"; a.click(); URL.revokeObjectURL(url);
});
document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("متأكدة تبين تمسحين كل الحجوزات المحفوظة على هذا الجهاز؟")) {
    localStorage.removeItem(STORAGE_KEY); render(); message.className=""; message.textContent="";
  }
});
render();
