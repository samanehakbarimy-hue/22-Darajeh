-- Where a specialist works, separately from what they do.
--
-- The headline held one free-text line — "Senior Mechanical Engineer" — and
-- the employer is most of what makes that line persuasive. Every profile in
-- this category states it: ADPList prints "Design Director, Owner at Activate
-- Vision", and the half after "at" is doing the heavy lifting.
--
-- A separate column rather than asking people to type it into the headline,
-- because a field can be shown consistently and a sentence cannot.
alter table mentor_profiles
  add column if not exists company text
  check (company is null or length(btrim(company)) <= 80);
