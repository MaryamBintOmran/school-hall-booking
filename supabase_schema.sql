-- مخطط أولي لقاعدة بيانات Supabase. لا تنشريه قبل مراجعة إعدادات الأمان.
create table if not exists public.hall_bookings (
  id uuid primary key default gen_random_uuid(),
  teacher_name text not null,
  purpose text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  attendees integer not null default 1 check (attendees > 0),
  created_at timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- منع تداخل الحجوزات يحتاج قيد exclusion مناسب أو دالة/معاملة قاعدة بيانات.
-- لا تفعّلي صلاحيات الكتابة العامة قبل إضافة سياسات RLS مناسبة.
alter table public.hall_bookings enable row level security;
