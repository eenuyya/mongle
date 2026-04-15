-- profiles 테이블
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio          text check (char_length(bio) <= 40),
  updated_at   timestamptz default now()
);

-- 회원가입 시 자동으로 profiles 행 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;

create policy "profiles: 누구나 읽기" on profiles
  for select using (true);

create policy "profiles: 본인만 삽입" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles: 본인만 수정" on profiles
  for update using (auth.uid() = id);
