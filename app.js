const db = window.supabase.createClient(
  "https://ogpmyfkbqrvfeoodhqva.supabase.co",
  "sb_publishable_xAcsee1CId20r8yweYxdIg_2KcxDwr_"
);
const STORAGE_KEY = "schoolHallBookingsDemo";
const form = document.getElementById("bookingForm");
const message = document.getElementById("message");
const list = document.getElementById("bookingList");
const count = document.getElementById("count");

const readBookings = async () => {
  const { data, error } = await db
    .from("hall_booking")
    .select("*")
    .order("booking_date", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map(b => ({
    id: b.id,
    teacher: b.teacher_name,
    purpose: b.purpose,
    date: b.booking_date,
    start: b.start_time,
    end: b.end_time
  }));
};

const saveBookings = async (items) => {
  // سنضيف طريقة الحفظ في قاعدة البيانات بالخطوة التالية.
};
const fmtDate = date => new Date(date + "T12:00:00").toLocaleDateString("ar-KW", {year:"numeric",month:"long",day:"numeric"});
const overlaps = (a,b) => a.date === b.date && a.start < b.end && b.start < a.end;

async function render() { const bookings = await readBookings();
bookings.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start) );
count.textContent = `${bookings.length} حجز`;
if (!bookings.length) { list.innerHTML = '<div class="empty">لا توجد حجوزات مسجلة للحين</div>'; return; }
list.innerHTML = bookings.map(b => `<article class="booking"> <div> <strong>${escapeHtml(b.purpose)}</strong> <small>${fmtDate(b.date)} · ${b.start} - ${b.end}</small> </div> </article>`).join("");
                        }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
form.addEventListener("submit", async e => {
  e.preventDefault();

  const booking = {
    teacher_name: document.getElementById("teacher").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    booking_date: document.getElementById("date").value,
    start_time: document.getElementById("start").value,
    end_time: document.getElementById("end").value
  };

  if (
    !booking.teacher_name ||
    !booking.purpose ||
    !booking.booking_date ||
    !booking.start_time ||
    !booking.end_time ||
    booking.start_time >= booking.end_time
  ) {
    message.className = "error";
    message.textContent = "تأكدي من البيانات ووقت البداية والنهاية.";
    return;
  }

  const { data: existingBookings, error: readError } = await db
    .from("hall_booking")
    .select("booking_date,start_time,end_time")
    .eq("booking_date", booking.booking_date);

  if (readError) {
    message.className = "error";
    message.textContent = "تعذر التحقق من الحجوزات. حاولي مرة ثانية.";
    return;
  }

  const conflict = existingBookings.some(b =>
    b.start_time < booking.end_time &&
    booking.start_time < b.end_time
  );

  if (conflict) {
    message.className = "error";
    message.textContent = "هذا الوقت محجوز، اختاري وقتًا آخر.";
    return;
  }

  const { error } = await db.from("hall_booking").insert([booking]);

  if (error) {
    console.error(error);
    message.className = "error";
    message.textContent = "تعذر حفظ الحجز. تحققي من إعدادات قاعدة البيانات.";
    return;
  }

  message.className = "success";
  message.textContent = "تم تسجيل الحجز بنجاح.";
  form.reset();
  await render();
  const card = document.getElementById("bookingCard");
  card.hidden = false;
  card.innerHTML = `<div style="border:2px solid #c5a45b; border-radius:16px; padding:24px; margin-top:16px; text-align:center; background:#fffdf7; color:#173f35;">
  <h2>دار مريم</h2> 
  <h3>بطاقة حجز القاعة</h3> 
  <p>تم تسجيل الحجز بنجاح<p>
  </div>`;
  document.getElementById("downloadCard").addEventListener("click", async () => {
  const card = document.getElementById("bookingCard");

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 650;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#c5a45b";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, 860, 610);

  ctx.textAlign = "center";
  ctx.fillStyle = "#173f35";
  ctx.font = "bold 52px Arial";
  ctx.fillText("دار مريم", 450, 115);

  ctx.font = "bold 34px Arial";
  ctx.fillText("بطاقة حجز القاعة", 450, 180);

  const lines = card.innerText.split("\n").filter(Boolean);
  ctx.font = "28px Arial";

  let y = 280;
  lines.forEach(line => {
    if (!line.includes("تنزيل بطاقة")) {
      ctx.fillText(line, 450, y);
      y += 55;
    }
  });

  const link = document.createElement("a");
  link.download = "بطاقة-حجز-دار-مريم.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
 });
document.getElementById("exportBtn").addEventListener("click", async () => {
  const bookings = await readBookings();

  const rows = [
    ["اسم المعلمة", "الغرض", "التاريخ", "البداية", "النهاية"],
    ...bookings.map(b => [
      b.teacher,
      b.purpose,
      b.date,
      b.start,
      b.end
    ])
  ];

  const csv = "\uFEFF" + rows.map(row =>
    row.map(v => String(v ?? "")).join(",")
  ).join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );

  const a = document.createElement("a");
  a.href = url;
  a.download = "school-hall-bookings.csv";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("متأكدة تبين مسح جميع الحجوزات المحفوظة؟")) {
    return;
  }

  message.className = "";
  message.textContent = "هذا الزر غير مفعّل حاليًا لحماية الحجوزات.";
});

render();
