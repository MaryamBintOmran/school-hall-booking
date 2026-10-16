const db = window.supabase.createClient(
  "https://ogpmyfkbqrvfeoodhqva.supabase.co",
  "sb_publishable_xAcsee1CId20r8yweYxdIg_2KcxDwr_"
);

const form = document.getElementById("bookingForm");
const message = document.getElementById("message");
const list = document.getElementById("bookingList");
const count = document.getElementById("count");

// Add the site designer credit directly beneath the main page heading.
const pageHeading = Array.from(document.querySelectorAll("h1")).find(el =>
  el.textContent.includes("حجز قاعة دار مريم")
) || document.querySelector("h1");
if (pageHeading && !document.getElementById("siteDesignerCredit")) {
  const credit = document.createElement("p");
  credit.id = "siteDesignerCredit";
  credit.textContent = "تصميم الموقع: أ/دانه ساكت المحيني";
  credit.style.cssText = "margin:6px 0 18px;text-align:center;font-size:14px;color:#c5a45b;font-weight:600;";
  pageHeading.insertAdjacentElement("afterend", credit);
}

// Public page reads only the fields needed to show the schedule.
const readBookings = async () => {
  const { data, error } = await db
    .from("hall_booking")
    .select("id,purpose,booking_date,start_time,end_time")
    .order("booking_date", { ascending: true });

  if (error) {
    console.error(error);
    message.className = "error";
    message.textContent = "تعذر تحميل الحجوزات. تحققي من إعدادات قاعدة البيانات.";
    return [];
  }

  return data.map(b => ({
    id: b.id,
    purpose: b.purpose,
    date: b.booking_date,
    start: b.start_time,
    end: b.end_time
  }));
};

const fmtDate = date => new Date(date + "T12:00:00").toLocaleDateString("ar-KW", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

async function render() {
  const bookings = await readBookings();
  bookings.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  count.textContent = `${bookings.length} حجز`;

  if (!bookings.length) {
    list.innerHTML = '<div class="empty">لا توجد حجوزات مسجلة للحين</div>';
    return;
  }

  list.innerHTML = bookings.map(b => `
    <article class="booking">
      <div>
        <strong>${escapeHtml(b.purpose)}</strong>
        <small>${fmtDate(b.date)} · ${escapeHtml(b.start)} - ${escapeHtml(b.end)}</small>
      </div>
    </article>
  `).join("");
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
    console.error(readError);
    message.className = "error";
    message.textContent = "تعذر التحقق من الحجوزات. حاولي مرة ثانية.";
    return;
  }

  const conflict = (existingBookings ?? []).some(b =>
    b.start_time < booking.end_time && booking.start_time < b.end_time
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
document.getElementById("downloadCard").hidden = false;
  const card = document.getElementById("bookingCard");
  if (card) {
    card.hidden = false;
    card.innerHTML = `
      <div style="border:2px solid #c5a45b; border-radius:16px; padding:24px; margin-top:16px; text-align:center; background:#fffdf7; color:#173f35;">
        <h2>دار مريم</h2>
        <h3>بطاقة حجز القاعة</h3>
        <p><strong>الغرض:</strong> ${escapeHtml(booking.purpose)}</p>
        <p><strong>التاريخ:</strong> ${fmtDate(booking.booking_date)}</p>
        <p><strong>الوقت:</strong> ${escapeHtml(booking.start_time)} - ${escapeHtml(booking.end_time)}</p>
        <p>تم تسجيل الحجز بنجاح</p>
      </div>`;
  }
});

const downloadButton = document.getElementById("downloadCard");
if (downloadButton) {
  downloadButton.addEventListener("click", () => {
    const card = document.getElementById("bookingCard");
    if (!card || card.hidden) {
      message.className = "error";
      message.textContent = "سجلي الحجز أولًا حتى تتمكني من تنزيل البطاقة.";
      return;
    }

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

    const lines = card.innerText.split("\n").filter(Boolean)
      .filter(line => !line.includes("دار مريم") && !line.includes("بطاقة حجز القاعة"));
    ctx.font = "28px Arial";
    let y = 270;
    lines.forEach(line => {
      // Wrap longer lines so they remain inside the card.
      const maxWidth = 780;
      if (ctx.measureText(line).width <= maxWidth) {
        ctx.fillText(line, 450, y);
        y += 55;
      } else {
        const words = line.split(" ");
        let part = "";
        for (const word of words) {
          const test = part ? `${part} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && part) {
            ctx.fillText(part, 450, y);
            y += 42;
            part = word;
          } else {
            part = test;
          }
        }
        if (part) {
          ctx.fillText(part, 450, y);
          y += 55;
        }
      }
    });

    // Add the designer credit beneath the booking confirmation on the PNG card.
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#173f35";
    ctx.fillText("تصميم الموقع: أ/ دانة ساكت المحيني", 450, 610);

    // Open an HTML page from the user tap, then show the generated PNG inside it.
    // This avoids iOS Safari opening a blank tab for a data URL.
    const imageWindow = window.open("", "_blank");
    if (!imageWindow) {
      message.className = "error";
      message.textContent = "سفاري منع فتح البطاقة. اسمحي بالنوافذ المنبثقة ثم اضغطي تحميل البطاقة مرة ثانية.";
      return;
    }

    imageWindow.document.open();
    imageWindow.document.write(`<!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>بطاقة حجز دار مريم</title>
        <style>
          body { margin: 0; padding: 16px; background: #f4f1e8; color: #173f35;
                 font-family: Arial, sans-serif; text-align: center; }
          p { line-height: 1.7; }
          img { display: block; width: 100%; max-width: 900px; height: auto;
                margin: 16px auto; background: #fffdf7; }
        </style>
      </head>
      <body>
        <p><strong>بطاقة الحجز جاهزة</strong></p>
        <p>لحفظها على الآيفون: اضغطي مطولًا على الصورة ثم اختاري «حفظ في الصور» أو «إضافة إلى الصور».</p>
        <img id="booking-card-image" alt="بطاقة حجز دار مريم">
      </body>
      </html>`);
    imageWindow.document.close();

    canvas.toBlob(blob => {
      if (!blob) {
        imageWindow.document.body.insertAdjacentText("beforeend", " تعذر إنشاء صورة البطاقة. أغلقي الصفحة وحاولي مرة أخرى.");
        return;
      }
      const imageUrl = URL.createObjectURL(blob);
      const image = imageWindow.document.getElementById("booking-card-image");
      image.onload = () => URL.revokeObjectURL(imageUrl);
      image.src = imageUrl;
    }, "image/png");

    message.className = "success";
    message.textContent = "فتحت بطاقة الحجز في تبويب جديد. اضغطي مطولًا على الصورة واختاري حفظها في الصور.";
  });
}

const exportButton = document.getElementById("exportBtn");
if (exportButton) {
  exportButton.addEventListener("click", async () => {
    const bookings = await readBookings();
    const rows = [
      ["الغرض", "التاريخ", "البداية", "النهاية"],
      ...bookings.map(b => [b.purpose, b.date, b.start, b.end])
    ];
    const csv = "\uFEFF" + rows.map(row =>
      row.map(v => String(v ?? "")).join(",")
    ).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "school-hall-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

const clearButton = document.getElementById("clearBtn");
if (clearButton) {
  clearButton.addEventListener("click", () => {
    if (!confirm("متأكدة تبين مسح جميع الحجوزات المحفوظة؟")) return;
    message.className = "";
    message.textContent = "هذا الزر غير مفعّل حاليًا لحماية الحجوزات.";
  });
}

render();
