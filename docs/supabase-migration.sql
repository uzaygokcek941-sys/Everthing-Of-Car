-- Everything For My Car — ilerleme kaydı
-- Supabase Dashboard > SQL Editor'a yapıştırıp çalıştır.
-- Öncesinde: Authentication > Providers > Anonymous sign-ins AÇIK olmalı.

create table if not exists public.ilerleme (
  kullanici    uuid        not null references auth.users on delete cascade,
  prosedur     text        not null,
  puan         integer     not null check (puan between 0 and 100),
  gecti        boolean     not null default false,
  guncelleme   timestamptz not null default now(),
  primary key (kullanici, prosedur)
);

alter table public.ilerleme enable row level security;

-- Herkes yalnız kendi satırını görür ve yazar. Anon anahtarı tek başına
-- hiçbir satıra erişemez; erişim oturumun uid'sine bağlıdır.
drop policy if exists ilerleme_kendi_okur on public.ilerleme;
create policy ilerleme_kendi_okur on public.ilerleme
  for select using (auth.uid() = kullanici);

drop policy if exists ilerleme_kendi_yazar on public.ilerleme;
create policy ilerleme_kendi_yazar on public.ilerleme
  for insert with check (auth.uid() = kullanici);

drop policy if exists ilerleme_kendi_gunceller on public.ilerleme;
create policy ilerleme_kendi_gunceller on public.ilerleme
  for update using (auth.uid() = kullanici) with check (auth.uid() = kullanici);

-- Aynı dersi tekrar eden öğrencinin puanı düşerse eski puan korunur:
-- ilerleme geriye gitmez, ama tarih güncellenir.
create or replace function public.ilerleme_en_iyiyi_tut()
returns trigger language plpgsql as $$
begin
  if new.puan < old.puan then
    new.puan := old.puan;
    new.gecti := old.gecti or new.gecti;
  end if;
  new.guncelleme := now();
  return new;
end $$;

drop trigger if exists ilerleme_en_iyi on public.ilerleme;
create trigger ilerleme_en_iyi before update on public.ilerleme
  for each row execute function public.ilerleme_en_iyiyi_tut();
