-- Remove old updates (deactivate them)
UPDATE app_updates 
SET is_active = false 
WHERE is_active = true;

-- Insert new updates

-- 1. Twitter announcement (highest priority)
INSERT INTO app_updates (title, description, type, is_active, priority, created_at)
VALUES (
  'We''re on Twitter! 🐦',
  'Follow us on Twitter for the latest updates, announcements, and community highlights. Stay connected with the NftGO community!',
  'announcement',
  true,
  3,
  NOW()
);

-- 2. MVP almost done
INSERT INTO app_updates (title, description, type, is_active, priority, created_at)
VALUES (
  'MVP Almost Complete! 🚀',
  'We''re putting the finishing touches on our MVP. Get ready for an amazing location-based NFT collection experience!',
  'update',
  true,
  2,
  NOW()
);

-- 3. Badges for testing and rewards
INSERT INTO app_updates (title, description, type, is_active, priority, created_at)
VALUES (
  'Badges Coming Soon! 🏆',
  'Earn exclusive badges for testing the app and participating in rewards programs. Show off your achievements and unlock special perks!',
  'announcement',
  true,
  1,
  NOW()
);


