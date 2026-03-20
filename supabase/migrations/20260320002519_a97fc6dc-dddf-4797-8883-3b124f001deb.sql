-- Update monthly plan price to R$ 12.90
UPDATE plans SET price = 12.90 WHERE id = '49a734d8-af86-4a0b-accf-755d947cc1d8';

-- Fix Luiz Carlos subscription: change to monthly plan with 1 month expiration
UPDATE subscriptions 
SET plan_id = '49a734d8-af86-4a0b-accf-755d947cc1d8',
    expires_at = (started_at + interval '1 month')
WHERE id = 'f892a885-e4c9-4821-8bb1-c4c38935ae04';